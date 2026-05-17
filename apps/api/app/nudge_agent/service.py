from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Literal

from app.core.config import get_settings

logger = logging.getLogger(__name__)

Verdict = Literal["BOLEH", "FIKIR_DULU", "JANGAN_DULU"]
ToneMode = Literal["professional", "friendly", "manglish", "strict", "encouraging"]
LanguagePreference = Literal["bm", "en", "manglish"]


@dataclass(slots=True)
class UserProfilePayload:
    name: str
    age: int | None
    occupation: str | None
    monthly_income: float | None


@dataclass(slots=True)
class TransactionIntentPayload:
    amount: float
    merchant: str
    category: str
    merchant_type: str
    item_name: str | None
    essential: bool
    uses_bnpl: bool = False


@dataclass(slots=True)
class BudgetContextPayload:
    current_balance: float
    days_until_salary: int
    current_daily_survival_amount: float
    projected_remaining_balance: float
    projected_daily_survival_amount: float
    category_budget_usage_pct: float
    total_monthly_spending: float | None


@dataclass(slots=True)
class BnplContextPayload:
    due_this_month: float
    due_within_7_days: float
    active_commitments: int


@dataclass(slots=True)
class PersonaPayload:
    code: str
    label: str
    description: str | None


@dataclass(slots=True)
class NudgeRequestModel:
    user_profile: UserProfilePayload
    transaction_intent: TransactionIntentPayload
    risk_score: int
    budget_context: BudgetContextPayload
    bnpl_context: BnplContextPayload
    user_persona: PersonaPayload
    language_preference: LanguagePreference
    tone_mode: ToneMode
    reason_codes: list[str]


@dataclass(slots=True)
class NudgeResponseModel:
    verdict: Verdict
    short_nudge: str
    explanation: str
    tradeoff: str
    alternative_action: str
    cta_buttons: list[str]
    language: LanguagePreference
    tone_mode: ToneMode
    provider: str
    examples: dict[str, str]


def _derive_verdict(risk_score: int) -> Verdict:
    if risk_score >= 70:
        return "JANGAN_DULU"
    if risk_score >= 45:
        return "FIKIR_DULU"
    return "BOLEH"


def _currency(amount: float) -> str:
    return f"RM{amount:,.2f}"


def _build_ctas(verdict: Verdict, uses_bnpl: bool = False) -> list[str]:
    if verdict == "JANGAN_DULU":
        if uses_bnpl:
            return ["Walk away — avoid BNPL", "Save to cash goal instead", "See safer options without debt"]
        return ["Save to wishlist", "Review after salary", "See safer options"]
    if verdict == "FIKIR_DULU":
        if uses_bnpl:
            return ["Wait 48 hours — BNPL is not free", "Calculate real cost", "Cash is safer"]
        return ["Wait 24 hours", "Compare options", "Keep in wishlist"]
    return ["Proceed mindfully", "Track purchase", "Set reminder"]


def _fallback_examples(payload: NudgeRequestModel, verdict: Verdict) -> dict[str, str]:
    name = payload.user_profile.name
    amount = _currency(payload.transaction_intent.amount)
    merchant = payload.transaction_intent.merchant
    current_balance = _currency(payload.budget_context.current_balance)
    current_daily = _currency(payload.budget_context.current_daily_survival_amount)
    projected_balance = _currency(payload.budget_context.projected_remaining_balance)
    projected_daily = _currency(payload.budget_context.projected_daily_survival_amount)
    days = payload.budget_context.days_until_salary

    if verdict == "JANGAN_DULU":
        return {
            "bm": (
                f"Jangan dulu, {name}. Baki sekarang {current_balance} untuk {days} hari. "
                f"Lepas beli {amount} di {merchant}, tinggal {projected_balance} sahaja."
            ),
            "en": (
                f"Not now, {name}. You have {current_balance} left for {days} days. "
                f"After spending {amount} at {merchant}, only {projected_balance} remains."
            ),
            "manglish": (
                f"Jangan dulu, {name}. You ada {current_balance} for {days} days, about {current_daily}/day. "
                f"After this {amount} buy, tinggal {projected_balance}, only {projected_daily}/day lah."
            ),
        }
    if verdict == "FIKIR_DULU":
        return {
            "bm": (
                f"Fikir dulu, {name}. Belian {amount} ini akan ketatkan bajet harian kepada {projected_daily}. "
                "Kalau bukan urgent, tunggu dulu."
            ),
            "en": (
                f"Think first, {name}. This {amount} purchase tightens your daily runway to {projected_daily}. "
                "If it is not urgent, give it a pause."
            ),
            "manglish": (
                f"Fikir dulu, {name}. This {amount} spend will squeeze you to {projected_daily}/day. "
                "If not urgent, let it sit in wishlist first."
            ),
        }
    return {
        "bm": (
            f"Boleh, {name}. Belian {amount} ini masih terkawal dan baki harian kekal sekitar {projected_daily}."
        ),
        "en": (
            f"You can proceed, {name}. This {amount} purchase is still manageable and keeps your daily runway around {projected_daily}."
        ),
        "manglish": (
            f"Boleh, {name}. This {amount} spend still looks okay and you still ada about {projected_daily}/day after that."
        ),
    }


def _fallback_nudge(payload: NudgeRequestModel) -> NudgeResponseModel:
    verdict = _derive_verdict(payload.risk_score)
    examples = _fallback_examples(payload, verdict)
    short_nudge = examples[payload.language_preference]

    if verdict == "JANGAN_DULU":
        explanation = (
            f"You have {_currency(payload.budget_context.current_balance)} left for "
            f"{payload.budget_context.days_until_salary} day(s). This purchase drops your safe daily amount "
            f"to {_currency(payload.budget_context.projected_daily_survival_amount)}."
        )
        tradeoff = (
            f"Buying now feels good, but it cuts your remaining buffer to "
            f"{_currency(payload.budget_context.projected_remaining_balance)}."
        )
        alternative_action = "Save the item to wishlist and review again after salary."
    elif verdict == "FIKIR_DULU":
        explanation = (
            f"This purchase pushes category usage to {payload.budget_context.category_budget_usage_pct:.0f}% "
            f"and reduces your runway to {_currency(payload.budget_context.projected_daily_survival_amount)} per day."
        )
        tradeoff = "Buying now is possible, but it reduces flexibility for the rest of the week."
        alternative_action = "Pause for 24 hours or find a cheaper substitute."
    else:
        explanation = (
            f"After this purchase, you still keep {_currency(payload.budget_context.projected_daily_survival_amount)} "
            "per day until salary."
        )
        tradeoff = "The spend is manageable, but similar repeats can still erode your runway."
        alternative_action = "Proceed if needed, then track the spend."

    if payload.tone_mode == "strict":
        tradeoff = tradeoff.replace("feels good", "is convenient")
        alternative_action = alternative_action.replace("or", "and")
    elif payload.tone_mode == "encouraging":
        alternative_action = alternative_action + " You are still building a better habit."
    elif payload.tone_mode == "professional":
        explanation = explanation.replace("You have", "Available balance is")
    elif payload.tone_mode == "friendly":
        alternative_action = alternative_action.replace("Proceed if needed", "Go ahead if you really need it")

    # BNPL-specific override for verdict
    if payload.transaction_intent.uses_bnpl and verdict == "FIKIR_DULU":
        verdict = "JANGAN_DULU"
        amount = _currency(payload.transaction_intent.amount)
        existing = _currency(payload.bnpl_context.due_this_month)
        examples = {
            "bm": f"JANGAN DULU! BNPL untuk {amount} akan tambah hutang. Anda dah berhutang {existing} bulan ni. Simpan duit dulu.",
            "en": f"HOLD UP! BNPL for {amount} adds to your {existing} debt this month. Save cash, then decide.",
            "manglish": f"WOI stop. BNPL for {amount} on top of {existing}? You gila ka? Simpan cash dulu boss.",
        }
        short_nudge = examples[payload.language_preference]
        explanation = f"Using BNPL for {_currency(payload.transaction_intent.amount)} adds invisible debt. You already owe {_currency(payload.bnpl_context.due_this_month)} this month."
        tradeoff = "BNPL feels cheap now but stacks into RM200+ monthly. Future you will be angry."
        alternative_action = "Save to a sinking fund instead — buy when you have the cash."
    elif payload.transaction_intent.uses_bnpl:
        # Already JANGAN_DULU — strengthen the BNPL message
        amount = _currency(payload.transaction_intent.amount)
        existing = _currency(payload.bnpl_context.due_this_month)
        examples = {
            "bm": f"JANGAN guna BNPL untuk {amount}. Anda dah berhutang {existing} bulan ni. Ini permulaan lingkaran hutang.",
            "en": f"DON'T use BNPL for {amount}. You already owe {existing} this month. This is how debt spirals start.",
            "manglish": f"WOI JANGAN. BNPL for {amount}? You already owe {existing} this month. This is how you drown in debt, bro.",
        }
        short_nudge = examples[payload.language_preference]
        explanation = f"BNPL for RM{payload.transaction_intent.amount:.2f}? With {_currency(payload.bnpl_context.due_this_month)} already due? This is how debt spirals start."
        tradeoff = "You'll pay later but the cost includes interest, late fees, and financial stress."
        alternative_action = "Wait, save cash, then buy. BNPL is not your friend."

    return NudgeResponseModel(
        verdict=verdict,
        short_nudge=short_nudge,
        explanation=explanation,
        tradeoff=tradeoff,
        alternative_action=alternative_action,
        cta_buttons=_build_ctas(verdict, payload.transaction_intent.uses_bnpl),
        language=payload.language_preference,
        tone_mode=payload.tone_mode,
        provider="template",
        examples=examples,
    )


async def _generate_with_ai(payload: NudgeRequestModel) -> NudgeResponseModel:
    settings = get_settings()

    # Try anthropic/ilmu first, then DeepSeek
    anthropic_key = settings.ilmu_api_key or settings.anthropic_api_key
    deepseek_key = settings.deepseek_api_key

    if anthropic_key and anthropic_key.startswith("sk-"):
        return await _generate_with_anthropic(payload, anthropic_key, settings)
    if deepseek_key and deepseek_key.startswith("sk-"):
        return await _generate_with_deepseek(payload, deepseek_key)
    raise RuntimeError("No supported AI API key configured")


async def _generate_with_anthropic(
    payload: NudgeRequestModel, api_key: str, settings
) -> NudgeResponseModel:
    import anthropic

    provider = "ilmu" if settings.ilmu_api_key else "anthropic"
    base_url = settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None
    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)
    verdict = _derive_verdict(payload.risk_score)
    prompt = _build_nudge_prompt(payload, verdict)

    message = await client.messages.create(
        model=settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    return _parse_ai_response(text, provider)


async def _generate_with_deepseek(
    payload: NudgeRequestModel, api_key: str
) -> NudgeResponseModel:
    import httpx

    verdict = _derive_verdict(payload.risk_score)
    prompt = _build_nudge_prompt(payload, verdict)

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "You are BajetBuddy, a Malaysian personal finance AI. You speak Manglish, BM, and English. Return strict JSON only."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 600,
                "temperature": 0.7,
            },
        )
        data = resp.json()
        text = data["choices"][0]["message"]["content"].strip()
    return _parse_ai_response(text, "deepseek")


def _build_nudge_prompt(payload: NudgeRequestModel, verdict: str) -> str:
    """Build a rich, context-aware prompt for smarter nudge generation."""
    p = payload
    persona = p.user_persona
    budget = p.budget_context
    txn = p.transaction_intent

    # Build spending habit context
    habit_context = ""
    if persona.code and persona.code != "unknown":
        persona_descriptions = {
            "midnight_shopee_queen": "late-night online shopping clusters, especially on Shopee/Lazada",
            "gaji_habis_king": "spends most salary within the first week, then struggles",
            "bubble_tea_bro": "frequent small discretionary spends on food/drinks",
            "mamak_lepak_spender": "social spending at mamak stalls and hangout spots",
            "bnpl_roller": "heavily reliant on Buy Now Pay Later, stacking multiple BNPL commitments",
            "grabfood_spiral": "excessive food delivery orders, avoiding home cooking",
            "bonus_burner": "splurges windfall/bonus money quickly without saving",
            "future_homeowner": "disciplined saver working toward a big goal like a house",
            "savings_starter": "beginner at saving, building good habits",
        }
        persona_hint = persona_descriptions.get(persona.code, persona.description or "")
        habit_context = f"""
SPENDING PERSONA: {persona.label} ({persona.code})
Pattern: {persona_hint}
This user's financial behavior profile: {persona.description or 'N/A'}
"""

    # Budget context with personalized advice hints
    daily_after = budget.projected_daily_survival_amount
    daily_before = budget.current_daily_survival_amount
    balance_after = budget.projected_remaining_balance
    days_left = budget.days_until_salary

    budget_context = f"""
BUDGET SNAPSHOT:
- Current balance: RM{budget.current_balance:.2f}
- Days until salary: {days_left}
- Current daily runway: RM{daily_before:.2f}/day
- After this RM{txn.amount:.2f} purchase:
  → Remaining: RM{balance_after:.2f}
  → Daily runway: RM{daily_after:.2f}/day
- Category ({txn.category}) usage: {budget.category_budget_usage_pct:.0f}%
- Total spent this month: RM{budget.total_monthly_spending or 0:.2f}
"""

    # BNPL context
    bnpl_context = ""
    if p.bnpl_context.due_this_month > 0:
        bnpl_context = f"""
BNPL / DEBT CONTEXT:
- BNPL due this month: RM{p.bnpl_context.due_this_month:.2f}
- BNPL due within 7 days: RM{p.bnpl_context.due_within_7_days:.2f}
- Active BNPL commitments: {p.bnpl_context.active_commitments}
"""
    if txn.uses_bnpl:
        bnpl_context += f"""
⚠️  USER WANTS TO USE BNPL FOR THIS RM{txn.amount:.2f} PURCHASE!
- verdict MUST be JANGAN_DULU — BNPL on top of existing debt is dangerous
- Short_nudge must warn about invisible debt stacking
- Explain the real cost: interest, late fees, credit score impact
- Tradeoff must contrast the BNPL illusion ("pay later feels easy") vs real cost
- CTA must include "Walk away — avoid BNPL"
"""

    # Reason codes with explanations
    reason_hints = {
        "LOW_DAILY_SURVIVAL": "daily runway is dangerously low after this purchase",
        "DAILY_SURVIVAL_BELOW_RM25": "daily survival drops below RM25 — crisis zone",
        "DAILY_SURVIVAL_TIGHT": "daily survival is tight, little room for error",
        "HIGH_CATEGORY_USAGE": "this category is already near or over budget",
        "CATEGORY_BUDGET_ABOVE_85": "category budget is over 85% used",
        "DISCRETIONARY_PURCHASE": "this is a want, not a need",
        "ESSENTIAL_PURCHASE_BUFFER": "this is essential — give benefit of the doubt",
        "BNPL_DUE_THIS_MONTH": "there are BNPL payments due this month",
        "BNPL_DUE_WITHIN_7_DAYS": "BNPL is due within a week — very risky to spend",
        "BNPL_DUE_SOON_DISCRETIONARY": "discretionary spend while BNPL is due soon",
        "END_OF_MONTH_PRESSURE": "it's late in the salary cycle, budget is tight",
        "LONG_TIME_TO_SALARY": "salary is far away, need to stretch the budget",
        "MIDNIGHT_SPENDING_PATTERN": "late-night shopping pattern detected — impulse risk",
        "LATE_NIGHT_PURCHASE": "purchasing late at night — possible impulse buy",
        "HISTORICAL_BEHAVIOUR_RISK": "past behavior suggests risky spending pattern",
        "PAYDAY_NEAR": "salary is near, can wait a bit",
    }
    reasons_explained = "\n".join(
        f"  - {code}: {reason_hints.get(code, 'risk factor detected')}"
        for code in p.reason_codes
    ) if p.reason_codes else "  - No specific risk factors"

    verdict_guidance = {
        "JANGAN_DULU": "Block this purchase. The user's financial health is at risk. Be firm but empathetic. Acknowledge the temptation, then clearly explain the consequences. Offer a concrete alternative.",
        "FIKIR_DULU": "Caution the user. This purchase is borderline — possible but risky. Encourage a 24-hour pause. Help them weigh the pros and cons objectively.",
        "BOLEH": "Approve but with mindfulness. The numbers look okay, but remind them that small repeated spends add up. Encourage tracking and awareness.",
    }

    return f"""You are BajetBuddy, a Malaysian AI financial coach that intervenes BEFORE impulse purchases.
You speak Manglish (Malaysian English), BM, and English naturally.
Your tone is like a caring but firm friend — not a bank teller.

{habit_context}
{budget_context}
{bnpl_context}

RISK ASSESSMENT:
- Risk score: {p.risk_score}/100
- Verdict: {verdict}
- Reason codes:
{reasons_explained}

PURCHASE DETAILS:
- Amount: RM{txn.amount:.2f}
- Item: {txn.item_name or 'Unknown'}
- Merchant: {txn.merchant}
- Category: {txn.category} ({txn.merchant_type})

USER PROFILE:
- Name: {p.user_profile.name}
- Monthly income: RM{p.user_profile.monthly_income or 0:.2f}

GUIDANCE FOR THIS VERDICT:
{verdict_guidance.get(verdict, '')}

Return strict JSON only with this shape:
{{
  "verdict": "{verdict}",
  "short_nudge": "<catchy first line in Manglish, BM or EN — max 50 words, call user by name>",
  "explanation": "<why this verdict — reference their persona, spending pattern, or budget numbers. max 45 words>",
  "tradeoff": "<what they gain vs what they lose. max 35 words>",
  "alternative_action": "<one concrete thing they can do instead. max 25 words>",
  "cta_buttons": ["<button1>", "<button2>", "<button3>"],
  "language": "{p.language_preference}",
  "tone_mode": "{p.tone_mode}",
  "examples": {{
    "bm": "<BM version of the nudge>",
    "en": "<EN version of the nudge>",
    "manglish": "<Manglish version of the nudge>"
  }}
}}

IMPORTANT:
- Reference the user's persona ({persona.label}) if relevant to their spending behavior
- Use Malaysian context: RM, salary cycles, Shopee, Grab, mamak, lepak culture
- Make the nudge feel personal — not a generic template
- If they're a Midnight Shopee Queen, mention late-night shopping
- If they eat out a lot, suggest cooking at home
- Be firm on JANGAN_DULU, thoughtful on FIKIR_DULU, encouraging on BOLEH
- The examples MUST be in natural colloquial language, not formal"""


def _parse_ai_response(text: str, provider: str) -> NudgeResponseModel:
    start = text.find("{")
    end = text.rfind("}") + 1
    if start < 0 or end <= start:
        raise ValueError("AI response did not contain JSON")
    data = json.loads(text[start:end])
    data["provider"] = provider
    return NudgeResponseModel(**data)


async def generate_nudge_package(payload: NudgeRequestModel) -> NudgeResponseModel:
    try:
        return await _generate_with_ai(payload)
    except Exception as exc:
        logger.warning("AI nudge generation failed, falling back to template: %s", exc)
        return _fallback_nudge(payload)
