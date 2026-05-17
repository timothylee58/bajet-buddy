from __future__ import annotations

import base64
import json
import re
import time
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.auth import DEMO_USER_ID
from app.core.database import get_supabase
from app.schemas.ocr import (
    OCRInsertResult,
    OCRScanRequest,
    OCRScanResponse,
    OCRScanResult,
    OCRTransaction,
)


RECEIPT_SYSTEM_PROMPT = """You are a receipt and bank statement OCR engine for BajetBuddy.
Extract structured transaction data from the image.

First, determine the document type: "receipt" or "bank_statement".

Return a valid JSON object:
{
  "document_type": "receipt" or "bank_statement",
  "store_name": "for receipts: merchant name",
  "total_amount": for receipts: total in RM as float,
  "transactions": [
    {
      "merchant": "store or payee name",
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


def _clean_base64(raw: str) -> str:
    if "," in raw and raw.startswith("data:"):
        return raw
    mime_hint = "image/jpeg"
    if raw.startswith("iVBOR"):
        mime_hint = "image/png"
    return f"data:{mime_hint};base64,{raw}"


async def scan_receipt(request: OCRScanRequest, user_id: str = "00000000-0000-0000-0000-000000000001") -> OCRScanResponse:
    t0 = time.monotonic()
    settings = get_settings()
    image_data_url = _clean_base64(request.image_base64)

    try:
        raw_b64 = image_data_url.split(",", 1)[1] if "," in image_data_url else image_data_url
        base64.b64decode(raw_b64)
    except Exception as e:
        return OCRScanResponse(status="error", error=f"Invalid base64 image: {e}")

    # Resolve demo user to a real UUID from the profiles table
    resolved_user_id = await _resolve_user_id(user_id)

    # Try vision APIs. DeepSeek deepseek-chat does NOT support image_url content type.
    # Use OpenAI for vision; DeepSeek only for text-based OCR fallback (not implemented yet).
    if not settings.openai_api_key and not settings.deepseek_api_key:
        return OCRScanResponse(status="error", error="No API key configured (OPENAI_API_KEY or DEEPSEEK_API_KEY)")

    scan_result = None
    last_error = None

    # --- Attempt 1: OpenAI Vision (GPT-4o-mini) ---
    if settings.openai_api_key:
        try:
            scan_result = await _call_openai_vision(image_data_url, settings)
        except Exception as e:
            last_error = e

    # --- Attempt 2: DeepSeek — NOT SUPPORTED for vision ---
    # deepseek-chat is text-only. Skip rather than making a guaranteed-to-fail call.
    # OpenAI is required for OCR/image scanning.

    if scan_result is None:
        return OCRScanResponse(status="error", error=f"All vision APIs failed: {last_error}")

    # Ensure demo profile exists (FK from transactions → profiles needs it)
    if resolved_user_id == DEMO_USER_ID:
        await _ensure_demo_profile()

    # Bulk insert
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
        insert_results=insert_results,
        total_inserted=inserted,
        total_failed=failed,
        xp_earned=inserted * 50,
        processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
    )



async def _resolve_user_id(user_id: str) -> str:
    """If user_id is 'demo' use the hard-coded demo UUID.
    Otherwise return as-is if it looks like a valid UUID."""
    if user_id == "00000000-0000-0000-0000-000000000001" or len(user_id) < 32:
        return DEMO_USER_ID
    return user_id


async def _ensure_demo_profile():
    """Upsert the demo profile so FK constraints on transactions don't fail."""
    supabase = get_supabase()
    if supabase is None:
        return
    try:
        supabase.table("profiles").upsert({
            "id": DEMO_USER_ID,
            "email": "demo@bajetbuddy.local",
            "full_name": "Demo User",
            "monthly_income": 3200,
        }).execute()
    except Exception:
        pass  # non-fatal — insert will still try and report the error


async def _insert_transaction(user_id: str, txn: OCRTransaction) -> OCRInsertResult:
    try:
        supabase = get_supabase()
        if supabase is None:
            return OCRInsertResult(
                merchant=txn.merchant, amount=txn.amount,
                db_inserted=False, db_error="Supabase not available",
            )
        # Use negative amount for debit in DB (to match dashboard display convention)
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
            transaction_id=tx_id, merchant=txn.merchant, amount=txn.amount,
            db_inserted=tx_id is not None,
            db_error=None if tx_id else "Insert returned no ID",
        )
    except Exception as e:
        return OCRInsertResult(
            merchant=txn.merchant, amount=txn.amount,
            db_inserted=False, db_error=str(e)[:200],
        )


def _parse_vision_response(raw_text: str) -> OCRScanResult:
    # Strip markdown fences — DeepSeek often wraps JSON in ```json ... ```
    clean = raw_text.strip()
    clean = re.sub(r"^```(?:json)?\s*\n?", "", clean)
    clean = re.sub(r"\n?\s*```$", "", clean)
    clean = clean.strip()

    # Debug: log the cleaned text for diagnostics
    import logging
    logger = logging.getLogger("ocr_service")
    logger.info(f"OCR raw response (first 300 chars): {raw_text[:300]}")
    logger.info(f"OCR cleaned response (first 300 chars): {clean[:300]}")

    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse OCR response as JSON: {e}. Raw: {clean[:500]}")

    transactions: list[OCRTransaction] = []
    for t in data.get("transactions", []) or []:
        transactions.append(OCRTransaction(
            merchant=str(t.get("merchant", "")),
            amount=float(t.get("amount", 0)),
            category=str(t.get("category", "other")),
            date=str(t.get("date", "")),
            note=str(t.get("note", "")),
            transaction_type=str(t.get("transaction_type", "debit")),
        ))
    return OCRScanResult(
        document_type=str(data.get("document_type", "receipt")),
        store_name=str(data.get("store_name", "")),
        total_amount=float(data.get("total_amount", 0)),
        line_items=list(transactions),
        transactions=transactions,
        raw_text=str(data.get("raw_text", clean[:500])),
    )


async def _call_deepseek_vision(image_data_url: str, settings: Any) -> OCRScanResult:
    """DeepSeek via OpenAI-compatible API — cheaper than GPT-4o."""
    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url="https://api.deepseek.com/v1",
    )
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": RECEIPT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all transactions from this image as JSON. Identify debit vs credit for each row."},
                    {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
                ],
            },
        ],
        max_tokens=4096,
        temperature=0.1,
    )
    raw_text = response.choices[0].message.content or ""
    try:
        return _parse_vision_response(raw_text)
    except Exception as e:
        raise RuntimeError(f"DeepSeek OCR parse failed: {e}") from e


async def _call_openai_vision(image_data_url: str, settings: Any) -> OCRScanResult:
    """OpenAI GPT-4o — fallback if DeepSeek is unavailable."""
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": RECEIPT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all transactions from this image as JSON. Identify debit vs credit for each row."},
                    {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
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
