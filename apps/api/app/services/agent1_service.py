from __future__ import annotations

import json
import time
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.database import get_supabase
from app.schemas.agent1 import Agent1ProfileResponse, SpendingSignal

MIN_TRANSACTIONS = 10

AGENT1_SYSTEM_PROMPT = """You are Agent 1 "Character Assigner" for BajetBuddy, a Malaysian personal finance app.
Analyse a user's transaction history and assign a financial persona.

Available persona classes:
- mamak_bro: frequents mamak/restaurants, high food spend relative to income
- gaji_habis_speedrunner: salary gone within days, zero savings pattern
- midnight_shopee_queen: late-night e-commerce shopping sprees
- bnpl_king: heavily reliant on Buy Now Pay Later schemes
- bubble_tea_bro: frequent small discretionary purchases (boba, snacks)
- grab_food_spiral: over-reliant on food delivery
- bonus_burner: spends windfalls/bonuses immediately
- future_homeowner: disciplined saver, consistent budget adherence
- savings_starter: beginning to save but still has impulse leaks
- weekend_warrior: heavy spending on weekends, frugal weekdays

Return a valid JSON object:
{
  "persona_code": "one of the codes above",
  "persona_name": "a fun Malaysian-ised name for this persona",
  "emoji": "a single emoji",
  "confidence": 0-100,
  "explanation": "2-3 sentences explaining the assignment",
  "signals": [
    {"signal": "description of one spending behaviour", "severity": "low|medium|high", "evidence": "specific numbers/data"}
  ]
}

Be honest: if the data is sparse or mixed, set confidence lower. Don't force a persona if patterns aren't clear."""


async def run_agent1_profile(user_id: str = "demo") -> Agent1ProfileResponse:
    t0 = time.monotonic()
    settings = get_settings()

    # 1. Fetch transactions from Supabase
    supabase = get_supabase()
    if supabase is None:
        return Agent1ProfileResponse(
            status="error", error="Supabase not available",
            min_required=MIN_TRANSACTIONS,
        )

    # Resolve demo user_id to a real UUID if needed
    resolved_user_id = user_id
    if user_id == "demo" or len(user_id) < 32:
        try:
            profiles = supabase.table("profiles").select("id").limit(1).execute()
            if hasattr(profiles, "data") and profiles.data and len(profiles.data) > 0:
                resolved_user_id = profiles.data[0]["id"]
            else:
                # No profiles at all — use a nil UUID that won't match anything
                resolved_user_id = "00000000-0000-0000-0000-000000000000"
        except Exception:
            resolved_user_id = "00000000-0000-0000-0000-000000000000"

    try:
        result = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", resolved_user_id) \
            .order("created_at", desc=True) \
            .limit(100) \
            .execute()

        transactions = result.data if hasattr(result, "data") and result.data else []
    except Exception as e:
        return Agent1ProfileResponse(
            status="error", error=f"DB fetch failed: {e}",
            min_required=MIN_TRANSACTIONS,
        )

    # 2. Check minimum data threshold
    if len(transactions) < MIN_TRANSACTIONS:
        return Agent1ProfileResponse(
            status="insufficient_data",
            transaction_count=len(transactions),
            min_required=MIN_TRANSACTIONS,
            explanation=f"Need at least {MIN_TRANSACTIONS} transactions for a reliable profile. Currently have {len(transactions)}. Upload more receipts or bank statements.",
            processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
        )

    # 3. Build summary for AI
    summary_lines = ["User transaction history:"]
    total_debit = 0.0
    total_credit = 0.0
    category_counts: dict[str, int] = {}
    category_amounts: dict[str, float] = {}
    merchants: list[str] = []

    for t in transactions:
        amount = float(t.get("amount", 0))
        cat = str(t.get("category", "other")).lower()
        merchant = str(t.get("merchant", ""))
        note = str(t.get("note", ""))[:60]

        if amount < 0:  # debit
            abs_amt = abs(amount)
            total_debit += abs_amt
            category_counts[cat] = category_counts.get(cat, 0) + 1
            category_amounts[cat] = category_amounts.get(cat, 0) + abs_amt
        else:  # credit
            total_credit += amount

        merchants.append(merchant)
        summary_lines.append(
            f"  {t.get('created_at','?')[:10]} | {merchant[:25]:25s} | RM{abs(amount):>8.2f} | {cat:12s} | {note}"
        )

    summary_lines.append(f"\nTotal debits: RM{total_debit:.2f}")
    summary_lines.append(f"Total credits: RM{total_credit:.2f}")
    summary_lines.append(f"Categories: {json.dumps(category_counts)}")
    summary_lines.append(f"Unique merchants: {len(set(merchants))}")
    summary_lines.append(f"Total transactions: {len(transactions)}")

    transaction_summary = "\n".join(summary_lines)

    # 4. Call DeepSeek for persona analysis
    if not settings.deepseek_api_key:
        return Agent1ProfileResponse(
            status="error",
            error="DEEPSEEK_API_KEY not configured",
            transaction_count=len(transactions),
            processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
        )

    try:
        analysis = await _call_deepseek_analysis(transaction_summary, settings)
    except Exception as e:
        # Try OpenAI fallback
        if settings.openai_api_key:
            try:
                analysis = await _call_openai_analysis(transaction_summary, settings)
            except Exception as e2:
                return Agent1ProfileResponse(
                    status="error", error=f"AI analysis failed: {e2}",
                    transaction_count=len(transactions),
                    processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
                )
        else:
            return Agent1ProfileResponse(
                status="error", error=f"AI analysis failed: {e}",
                transaction_count=len(transactions),
                processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
            )

    # 5. Parse and return
    signals = []
    for s in analysis.get("signals", []) or []:
        signals.append(SpendingSignal(
            signal=str(s.get("signal", "")),
            severity=str(s.get("severity", "medium")),
            evidence=str(s.get("evidence", "")),
        ))

    return Agent1ProfileResponse(
        status="ok",
        persona_code=analysis.get("persona_code", ""),
        persona_name=analysis.get("persona_name", ""),
        emoji=analysis.get("emoji", ""),
        confidence=int(analysis.get("confidence", 0)),
        explanation=analysis.get("explanation", ""),
        top_signals=signals,
        transaction_count=len(transactions),
        min_required=MIN_TRANSACTIONS,
        processing_time_ms=round((time.monotonic() - t0) * 1000, 1),
        raw_analysis=json.dumps(analysis, indent=2),
    )


async def _call_deepseek_analysis(summary: str, settings: Any) -> dict[str, Any]:
    client = AsyncOpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com/v1")
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": AGENT1_SYSTEM_PROMPT},
            {"role": "user", "content": summary},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    raw = response.choices[0].message.content or ""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


async def _call_openai_analysis(summary: str, settings: Any) -> dict[str, Any]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": AGENT1_SYSTEM_PROMPT},
            {"role": "user", "content": summary},
        ],
        response_format={"type": "json_object"},
        max_tokens=1024,
        temperature=0.7,
    )
    raw = response.choices[0].message.content or ""
    return json.loads(raw)
