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


def _build_ctas(verdict: Verdict) -> list[str]:
    if verdict == "JANGAN_DULU":
        return ["Save to wishlist", "Review after salary", "See safer options"]
    if verdict == "FIKIR_DULU":
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

    return NudgeResponseModel(
        verdict=verdict,
        short_nudge=short_nudge,
        explanation=explanation,
        tradeoff=tradeoff,
        alternative_action=alternative_action,
        cta_buttons=_build_ctas(verdict),
        language=payload.language_preference,
        tone_mode=payload.tone_mode,
        provider="template",
        examples=examples,
    )


async def _generate_with_ai(payload: NudgeRequestModel) -> NudgeResponseModel:
    settings = get_settings()
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    if not api_key or not api_key.startswith("sk-"):
        raise RuntimeError("No supported AI API key configured")

    import anthropic

    provider = "ilmu" if settings.ilmu_api_key else "anthropic"
    base_url = (
        settings.ilmu_anthropic_base_url
        if settings.ilmu_api_key
        else None
    )
    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)
    verdict = _derive_verdict(payload.risk_score)
    prompt = f"""
You are BajetBuddy, a Malaysian pre-purchase intervention engine.
Return strict JSON only.

Generate emotionally intelligent nudge copy for this payload:
{json.dumps(payload, default=lambda obj: obj.__dict__, ensure_ascii=True)}

Rules:
- verdict must stay {verdict}
- tone mode is {payload.tone_mode}
- preferred language is {payload.language_preference}
- keep short_nudge under 45 words
- explanation under 40 words
- tradeoff under 30 words
- alternative_action under 20 words
- cta_buttons must contain exactly 3 short button labels
- examples must contain bm, en, manglish

JSON shape:
{{
  "verdict": "BOLEH|FIKIR_DULU|JANGAN_DULU",
  "short_nudge": "...",
  "explanation": "...",
  "tradeoff": "...",
  "alternative_action": "...",
  "cta_buttons": ["...", "...", "..."],
  "language": "bm|en|manglish",
  "tone_mode": "professional|friendly|manglish|strict|encouraging",
  "examples": {{"bm": "...", "en": "...", "manglish": "..."}}
}}
"""

    message = await client.messages.create(
        model=settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
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
