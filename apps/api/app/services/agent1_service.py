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


async def run_agent1_profile(user_id: str = "00000000-0000-0000-0000-000000000001") -> Agent1ProfileResponse:
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
    if user_id == "00000000-0000-0000-0000-000000000001" or len(user_id) < 32:
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
    signals = [
        SpendingSignal(
            signal=str(s.get("signal", "")),
            severity=str(s.get("severity", "medium")),
            evidence=str(s.get("evidence", "")),
        )
        for s in analysis.get("signals", []) or []
    ]

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


# ── Onboarding-specific persona analysis from Q&A answers ──

ONBOARDING_SYSTEM_PROMPT = """You are Agent 1 "Character Assigner" for BajetBuddy, a Malaysian personal finance app.
A new user just answered 5 onboarding questions. Based solely on these answers, assign them a financial persona.

The 5 questions and their meanings:
1. coffee_boba_weekly_estimate: "under_20" = frugal, "20_50" = moderate, "over_50" = heavy spender on drinks
2. impulse_category_lean: "shopee" = online shopping addict, "grabfood" = food delivery addict, "gaming" = Steam/gaming, "fashion" = sneakers/clothing
3. balance_check_behavior: "before" = disciplined, "after" = reactive, "never" = financially unaware
4. late_night_impulse_tolerance: "buy" = high impulse, "ignore" = disciplined, "cart" = procrastinator (but still tempted)
5. savings_disposition: "savings" = saver mindset, "spend" = spender, "bills" = responsible but stretched

Available persona classes:
- mamak_bro: frequents mamak/restaurants, high food spend
- gaji_habis_speedrunner: salary gone within days, zero savings
- midnight_shopee_queen: late-night e-commerce shopping sprees
- bnpl_king: heavily reliant on Buy Now Pay Later schemes (inferred from high spending + low balance checking)
- bubble_tea_bro: frequent small discretionary purchases, especially boba/drinks
- grab_food_spiral: over-reliant on food delivery
- bonus_burner: spends windfalls immediately (treat myself answers)
- future_homeowner: disciplined saver
- savings_starter: beginning to save but has impulse leaks
- weekend_warrior: mixed signals — frugal weekdays, wild weekends

Assignment logic hints:
- over_50 boba + shopee guilt + buy at midnight → midnight_shopee_queen
- over_50 boba + grabfood guilt → grab_food_spiral
- over_50 boba alone → bubble_tea_bro
- never checks balance + buy at midnight → potential gaji_habis_speedrunner
- before checking + savings disposition → future_homeowner
- after checking + bills → responsible but stretched
- spend disposition + buy at midnight → bonus_burner

Return a JSON object:
{
  "persona_code": "one of the codes above",
  "persona_name": "a fun Malaysian-ised name",
  "emoji": "a single relevant emoji",
  "confidence": 0-100 (how sure you are based on only 5 questions),
  "explanation": "2-3 sentences explaining why this persona fits their answers",
  "roast": "a playful, Malaysian-style roast based on their answers — make it funny and slightly savage but loving",
  "estimated_spending_profile": {"food": amount, "shopping": amount, "transport": amount, "bills": amount},
  "signals": [{"signal": "...", "severity": "low|medium|high", "evidence": "from answer X"}]
}"""


async def analyze_onboarding_answers(
    answers: dict[str, str], user_id: str = "00000000-0000-0000-0000-000000000001"
) -> dict:
    """Run onboarding persona analysis via DeepSeek. Saves result to DB."""
    import time as _time
    t0 = _time.monotonic()
    settings = get_settings()

    if not settings.deepseek_api_key:
        return {
            "status": "error",
            "error": "DEEPSEEK_API_KEY not configured",
            "processing_time_ms": round((_time.monotonic() - t0) * 1000, 1),
        }

    # Build the prompt
    answers_text = "\n".join(f"  {k}: {v}" for k, v in answers.items())
    full_prompt = f"Onboarding answers:\n{answers_text}\n\n"

    # Include transaction data if available
    txn_list = answers.get("transactions", []) or answers.get("_txns", [])
    if txn_list and len(txn_list) > 0:
        full_prompt += f"Also, the user just uploaded their bank statement. Here are {len(txn_list)} real transactions:\n"
        for t in txn_list[:20]:
            full_prompt += f"  {t.get('merchant','?'):25s} RM{t.get('amount',0):>8.2f} {t.get('category','other')}\n"
        full_prompt += "\nWith real transaction data, your confidence should be HIGHER. Use both Q&A and transactions.\n"
    else:
        full_prompt += "\nThe user hasn't uploaded real transactions yet, so confidence should be MODERATE (50-70). Note this.\n"

    full_prompt += "Analyse and assign a financial persona."

    # Call DeepSeek
    try:
        analysis = await _call_deepseek_analysis_onboarding(full_prompt, settings)
    except Exception:
        try:
            analysis = await _call_openai_analysis_onboarding(full_prompt, settings)
        except Exception as e2:
            return {
                "status": "error",
                "error": str(e2),
                "processing_time_ms": round((_time.monotonic() - t0) * 1000, 1),
            }

    # Save to persona_snapshots table for future reference
    try:
        supabase = get_supabase()
        if supabase:
            supabase.table("persona_snapshots").insert({
                "user_id": user_id,
                "persona_code": analysis.get("persona_code", ""),
                "persona_name": analysis.get("persona_name", ""),
                "confidence": analysis.get("confidence", 0),
                "explanation": analysis.get("explanation", ""),
                "top_signals": analysis.get("signals", []),
            }).execute()
    except Exception:
        pass  # non-fatal

    return {
        "status": "ok",
        "persona_code": analysis.get("persona_code", ""),
        "persona_name": analysis.get("persona_name", ""),
        "emoji": analysis.get("emoji", ""),
        "confidence": analysis.get("confidence", 0),
        "explanation": analysis.get("explanation", ""),
        "roast": analysis.get("roast", ""),
        "estimated_spending_profile": analysis.get("estimated_spending_profile", {}),
        "top_signals": analysis.get("signals", []),
        "processing_time_ms": round((_time.monotonic() - t0) * 1000, 1),
        "raw_analysis": json.dumps(analysis, indent=2),
    }


async def _call_deepseek_analysis_onboarding(prompt: str, settings: Any) -> dict[str, Any]:
    client = AsyncOpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com/v1")
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": ONBOARDING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    raw = response.choices[0].message.content or ""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


async def _call_openai_analysis_onboarding(prompt: str, settings: Any) -> dict[str, Any]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ONBOARDING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=1024,
        temperature=0.7,
    )
    raw = response.choices[0].message.content or ""
    return json.loads(raw)


# ── Existing transaction-based analysis ──

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
