from __future__ import annotations

import base64
import json
import logging
import re
import time
from typing import Any

import anthropic
from openai import AsyncOpenAI

from app.core.auth import DEMO_USER_ID
from app.core.config import get_settings
from app.core.database import get_supabase
from app.schemas.ocr import (
    OCRInsertResult,
    OCRScanRequest,
    OCRScanResponse,
    OCRScanResult,
    OCRSpendingSummary,
    OCRTransaction,
)

logger = logging.getLogger("ocr_service")

# ── Prompts ────────────────────────────────────────────────────────────────────

RECEIPT_SYSTEM_PROMPT = """You are a receipt, bank statement, and e-wallet screenshot OCR engine for BajetBuddy.
Extract structured transaction data from the image.

First, determine the document type: "receipt", "bank_statement", or "ewallet_screenshot".
"ewallet_screenshot" is a Malaysian e-wallet app's "Payment Successful" / "Transfer Successful" /
"Top Up Successful" confirmation screen (Touch 'n Go eWallet, MAE by Maybank, GrabPay, etc.) —
recognizable by the wallet app's branding/logo, a big checkmark/success icon, a counterparty name,
and a transaction reference number, but usually NO itemized line items or store name.

Return a valid JSON object:
{
  "document_type": "receipt" or "bank_statement" or "ewallet_screenshot",
  "store_name": "for receipts: merchant name",
  "total_amount": total in RM as float — for receipts the receipt total, for ewallet_screenshot the payment amount shown,
  "wallet_provider": "for ewallet_screenshot only: tng|mae|grabpay|other, else omit",
  "counterparty": "for ewallet_screenshot only: the recipient/sender name shown, else omit",
  "reference_id": "for ewallet_screenshot only: the transaction reference/receipt number shown, else omit",
  "wallet_transaction_type": "for ewallet_screenshot only: send|receive|payment|topup|bill_payment|other, else omit",
  "transactions": [
    {
      "merchant": "store/payee name, or the counterparty for ewallet_screenshot",
      "amount": amount in RM as POSITIVE float (always positive),
      "transaction_type": "debit" or "credit",
      "category": "food|groceries|shopping|transport|utilities|health|entertainment|income|other",
      "date": "YYYY-MM-DD or empty if unclear",
      "note": "item name or reference"
    }
  ],
  "raw_text": "visible text for debugging"
}

transaction_type rules:
- "debit" = money SPENT (purchases, payments, withdrawals, transfers out)
- "credit" = money RECEIVED (salary, refunds, transfers in, deposits)
- Bank statements label debits/credits per row — respect those labels.
- Receipts are always debit.
- E-wallet screenshots: "send"/"payment"/"topup"/"bill_payment" are debit; "receive" is credit.

Category mapping:
- food: restaurants, cafes, mamak, foodpanda, GrabFood
- groceries: Mydin, Lotus's, AEON, Giant, NSK, pasar, Jaya Grocer
- shopping: Shopee, Lazada, Zalora, Uniqlo, Padini, retail
- transport: petrol (Petronas, Shell, Caltex), Grab, toll, Touch 'n Go, LRT/MRT
- utilities: TNB, Syabas, Maxis, Celcom, Digi, Unifi, Astro, TM
- health: Guardian, Watsons, Caring, clinic, hospital, pharmacy
- entertainment: GSC, TGV, Netflix, Spotify, Steam, gaming
- income: salary, gaji, wages, dividends, refunds, deposits
- other: ATM withdrawal, bank transfer, bill payment, anything else

RULES:
- For bank statements, extract EVERY transaction row.
- Amounts ALWAYS positive. Use transaction_type to indicate direction.
- Malaysian dates in DD/MM/YYYY → convert to YYYY-MM-DD.
- Return ONLY valid JSON. No markdown fences, no explanation."""

SUMMARY_SYSTEM_PROMPT = """You are BajetBuddy, a Malaysian personal finance AI that speaks Manglish.
Given a list of transactions extracted from a receipt or bank statement, produce a brief spending summary.

Return ONLY valid JSON (no markdown fences) with exactly these fields:
{
  "headline": "one punchy Manglish headline about their spending (max 12 words)",
  "insight": "2-3 sentence analysis of their spending patterns in Manglish",
  "top_category": "the category with highest total spend",
  "total_debits": total amount of all debit transactions as float,
  "total_credits": total amount of all credit transactions as float,
  "savings_tip": "one specific actionable money-saving tip for Malaysia context"
}"""


# ── Public entry point ─────────────────────────────────────────────────────────

async def scan_receipt(
    request: OCRScanRequest,
    user_id: str = "00000000-0000-0000-0000-000000000001",
) -> OCRScanResponse:
    t0 = time.monotonic()
    settings = get_settings()
    image_data_url = _clean_base64(request.image_base64)

    # Validate base64
    try:
        raw_b64 = image_data_url.split(",", 1)[1] if "," in image_data_url else image_data_url
        base64.b64decode(raw_b64)
    except Exception as e:
        return OCRScanResponse(status="error", error=f"Invalid base64 image: {e}")

    if not (settings.openai_api_key or settings.ilmu_api_key or settings.anthropic_api_key):
        return OCRScanResponse(
            status="error",
            error="No AI API key configured — set OPENAI_API_KEY, ILMU_API_KEY, or ANTHROPIC_API_KEY",
        )

    # ── Step 1: OCR — GPT-4o preferred, Claude fallback on any failure ───────
    scan_result: OCRScanResult | None = None
    try:
        if settings.openai_api_key:
            try:
                scan_result = await _call_openai_vision(image_data_url, settings)
            except Exception:
                logger.warning("OpenAI vision failed, falling back to Claude")
                scan_result = await _call_claude_vision(image_data_url, settings)
        else:
            scan_result = await _call_claude_vision(image_data_url, settings)
        logger.info(
            "OCR success: %s txns extracted, doc_type=%s",
            len(scan_result.transactions),
            scan_result.document_type,
        )
    except Exception:
        logger.exception("OCR vision call failed")
        return OCRScanResponse(status="error", error="OCR failed due to an internal error.")

    # ── Step 2: AI Spending Summary via DeepSeek ───────────────────────────
    summary: OCRSpendingSummary | None = None
    if settings.deepseek_api_key and scan_result.transactions:
        try:
            summary = await _call_deepseek_summary(scan_result.transactions, settings)
            logger.info("DeepSeek summary generated: %s", summary.headline)
        except Exception as e:
            logger.warning("DeepSeek summary failed (non-fatal): %s", e)
            # Non-fatal — we still return the OCR result

    # ── Step 3: Resolve user + ensure demo profile ─────────────────────────
    resolved_user_id = await _resolve_user_id(user_id)
    if resolved_user_id == DEMO_USER_ID:
        await _ensure_demo_profile()

    # ── Step 4: Bulk insert transactions ──────────────────────────────────
    insert_results: list[OCRInsertResult] = []
    inserted = 0
    failed = 0

    for txn in scan_result.transactions:
        if txn.amount <= 0:
            continue
        result = await _insert_transaction(resolved_user_id, txn)
        insert_results.append(result)
        if result.db_inserted:
            inserted += 1
        else:
            failed += 1

    return OCRScanResponse(
        status="ok",
        scan_result=scan_result,
        spending_summary=summary,
        insert_results=insert_results,
        total_inserted=inserted,
        total_failed=failed,
        xp_earned=inserted * 50,
        processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
    )


# ── OCR: GPT-4o Vision (primary) ─────────────────────────────────────────────

async def _call_openai_vision(image_data_url: str, settings: Any) -> OCRScanResult:
    """Use GPT-4o for receipt/statement OCR — preferred for structured extraction."""
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": RECEIPT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract all transactions from this image as JSON. "
                            "Identify debit vs credit for each row."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url, "detail": "high"},
                    },
                ],
            },
        ],
        response_format={"type": "json_object"},
        max_tokens=4096,
        temperature=0.1,
    )
    raw_text = response.choices[0].message.content or ""
    try:
        return _parse_vision_response(raw_text)
    except Exception as e:
        raise RuntimeError(f"OpenAI OCR parse failed: {e}") from e


# ── OCR: Claude Vision (fallback) ────────────────────────────────────────────

async def _call_claude_vision(image_data_url: str, settings: Any) -> OCRScanResult:
    """Use Claude vision for receipt/statement OCR."""
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
    )
    # Use the dedicated vision model — ilmu_model ("nemo-super") is text-only
    model = settings.ilmu_vision_model if settings.ilmu_api_key else "claude-sonnet-4-6"

    # Extract mime type and raw base64 from data URL
    if "," in image_data_url:
        header, raw_b64 = image_data_url.split(",", 1)
        media_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        raw_b64 = image_data_url
        media_type = "image/jpeg"

    supported_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if media_type not in supported_types:
        media_type = "image/jpeg"

    response = await client.messages.create(
        model=model,
        system=RECEIPT_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": raw_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Extract all transactions from this image as JSON. "
                            "Identify debit vs credit for each row."
                        ),
                    },
                ],
            }
        ],
        max_tokens=4096,
        temperature=0.0,
    )
    raw_text = response.content[0].text if response.content else ""
    try:
        return _parse_vision_response(raw_text)
    except Exception as e:
        raise RuntimeError(f"Claude OCR parse failed: {e}") from e


# ── Summary: DeepSeek (text-only, cheap) ──────────────────────────────────────

async def _call_deepseek_summary(
    transactions: list[OCRTransaction],
    settings: Any,
) -> OCRSpendingSummary:
    """Use DeepSeek (text model) to generate a Manglish spending summary."""
    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url="https://api.deepseek.com/v1",
    )

    # Build a compact text representation of transactions
    txn_lines = []
    for t in transactions:
        direction = "OUT" if t.transaction_type == "debit" else "IN"
        txn_lines.append(
            f"- {t.merchant}: RM{t.amount:.2f} ({direction}, {t.category})"
            + (f" on {t.date}" if t.date else "")
        )
    txn_text = "\n".join(txn_lines)

    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Here are the transactions extracted from a document:\n\n{txn_text}\n\n"
                    "Summarize their spending patterns and give one actionable tip."
                ),
            },
        ],
        max_tokens=512,
        temperature=0.7,
    )
    raw = response.choices[0].message.content or ""
    return _parse_summary_response(raw)


# ── Parsers ────────────────────────────────────────────────────────────────────

def _clean_base64(raw: str) -> str:
    if "," in raw and raw.startswith("data:"):
        return raw
    mime_hint = "image/jpeg"
    if raw.startswith("iVBOR"):
        mime_hint = "image/png"
    return f"data:{mime_hint};base64,{raw}"


def _parse_vision_response(raw_text: str) -> OCRScanResult:
    clean = raw_text.strip()
    clean = re.sub(r"^```(?:json)?\s*\n?", "", clean)
    clean = re.sub(r"\n?\s*```$", "", clean)
    clean = clean.strip()
    # Vision models sometimes preface the JSON with a sentence of prose even
    # without fences — slice to the outermost braces rather than trusting the
    # whole string is valid JSON.
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start >= 0 and end > start:
        clean = clean[start:end]

    logger.debug("OCR cleaned response (first 500 chars): %s", clean[:500])

    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse OCR response as JSON: {e}. Raw: {clean[:500]}")

    transactions: list[OCRTransaction] = [
        OCRTransaction(
            merchant=str(t.get("merchant") or ""),
            amount=float(t.get("amount") or 0),
            category=str(t.get("category") or "other"),
            date=str(t.get("date") or ""),
            note=str(t.get("note") or ""),
            transaction_type=str(t.get("transaction_type") or "debit"),
        )
        for t in data.get("transactions", []) or []
    ]

    raw_doc_type = str(data.get("document_type") or "receipt").lower()
    # Match on "wallet" only, not "screenshot" — a receipt or bank statement
    # can legitimately be described as "a screenshot of a receipt" and would
    # otherwise get mislabeled as an e-wallet payment.
    if "wallet" in raw_doc_type:
        doc_type = "ewallet_screenshot"
    elif "bank" in raw_doc_type or "statement" in raw_doc_type:
        doc_type = "bank_statement"
    else:
        doc_type = "receipt"

    wallet_provider = None
    counterparty = None
    reference_id = None
    wallet_transaction_type = None
    if doc_type == "ewallet_screenshot":
        raw_provider = str(data.get("wallet_provider") or "other").lower()
        wallet_provider = raw_provider if raw_provider in {"tng", "mae", "grabpay"} else "other"
        counterparty = str(data.get("counterparty") or "") or None
        reference_id = str(data.get("reference_id") or "") or None
        raw_wallet_txn_type = str(data.get("wallet_transaction_type") or "other").lower()
        wallet_transaction_type = (
            raw_wallet_txn_type
            if raw_wallet_txn_type in {"send", "receive", "payment", "topup", "bill_payment"}
            else "other"
        )

    total_amount = float(data.get("total_amount") or 0)
    if total_amount == 0 and doc_type == "ewallet_screenshot" and transactions:
        # The prompt only asks the model for total_amount in receipt mode; for
        # e-wallet screenshots (usually a single payment) fall back to the sum
        # of extracted transactions rather than showing RM0.00.
        total_amount = round(sum(t.amount for t in transactions), 2)

    return OCRScanResult(
        document_type=doc_type,
        store_name=str(data.get("store_name") or ""),
        total_amount=total_amount,
        line_items=list(transactions),
        transactions=transactions,
        raw_text=str(data.get("raw_text") or clean[:500]),
        wallet_provider=wallet_provider,
        counterparty=counterparty,
        reference_id=reference_id,
        wallet_transaction_type=wallet_transaction_type,
    )


def _parse_summary_response(raw: str) -> OCRSpendingSummary:
    clean = raw.strip()
    clean = re.sub(r"^```(?:json)?\s*\n?", "", clean)
    clean = re.sub(r"\n?\s*```$", "", clean)
    # Extract JSON object
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start >= 0 and end > start:
        clean = clean[start:end]

    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse DeepSeek summary JSON: {e}")

    return OCRSpendingSummary(
        headline=str(data.get("headline", "Here's your spending breakdown")),
        insight=str(data.get("insight", "")),
        top_category=str(data.get("top_category", "other")),
        total_debits=float(data.get("total_debits", 0)),
        total_credits=float(data.get("total_credits", 0)),
        savings_tip=str(data.get("savings_tip", "")),
    )


# ── DB helpers ─────────────────────────────────────────────────────────────────

async def _resolve_user_id(user_id: str) -> str:
    if user_id == "00000000-0000-0000-0000-000000000001" or len(user_id) < 32:
        return DEMO_USER_ID
    return user_id


async def _ensure_demo_profile() -> None:
    supabase = get_supabase()
    if supabase is None:
        return
    try:
        supabase.table("profiles").upsert(
            {
                "id": DEMO_USER_ID,
                "email": "demo@bajetbuddy.local",
                "full_name": "Demo User",
                "monthly_income": 3200,
            }
        ).execute()
    except Exception:
        pass  # non-fatal


async def _insert_transaction(user_id: str, txn: OCRTransaction) -> OCRInsertResult:
    try:
        supabase = get_supabase()
        if supabase is None:
            return OCRInsertResult(
                merchant=txn.merchant,
                amount=txn.amount,
                db_inserted=False,
                db_error="Supabase not available",
            )
        db_amount = -txn.amount if txn.transaction_type == "debit" else txn.amount
        payload = {
            "user_id": user_id,
            "amount": db_amount,
            "category": txn.category.lower() or "other",
            "merchant": txn.merchant or "Unknown",
            "note": txn.note or f"OCR — {txn.merchant}",
            "verdict": "boleh",
        }
        response = supabase.table("transactions").insert(payload).execute()
        tx_id = None
        if hasattr(response, "data") and response.data:
            data = response.data
            tx_id = data[0].get("id") if isinstance(data, list) else data.get("id")
        return OCRInsertResult(
            transaction_id=tx_id,
            merchant=txn.merchant,
            amount=txn.amount,
            db_inserted=tx_id is not None,
            db_error=None if tx_id else "Insert returned no ID",
        )
    except Exception as e:
        return OCRInsertResult(
            merchant=txn.merchant,
            amount=txn.amount,
            db_inserted=False,
            db_error=str(e)[:200],
        )
