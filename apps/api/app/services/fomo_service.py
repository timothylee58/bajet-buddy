from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import TypedDict

import anthropic

from app.core.config import get_settings
from app.schemas.fomo import (
    FOMONegotiateRequest,
    FOMONegotiateResponse,
    FOMOOption,
    FOMOResolveRequest,
    FOMOResolveResponse,
)

_SAFE_DAILY_FLOOR = 20.0
_CARD_SPEND_RATIO = 0.3
_MAX_CARDS = 3
_COOLDOWN_HOURS = 12
_BNPL_DANGER_THRESHOLD = 200.0


class FOMOState(TypedDict):
    overspent_cards_used: int
    tax_mode_active: bool
    tax_rate_pct: float
    cooldown_until: datetime | None


_fomo_store: dict[str, FOMOState] = {}


def _get_state(user_id: str) -> FOMOState:
    if user_id not in _fomo_store:
        _fomo_store[user_id] = {
            "overspent_cards_used": 0,
            "tax_mode_active": False,
            "tax_rate_pct": 10.0,
            "cooldown_until": None,
        }
    return _fomo_store[user_id]


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def _call_claude(item_name: str, merchant: str, amount: float, category: str) -> dict[str, str]:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url,
    )
    model = settings.ilmu_model or "claude-opus-4-5"

    prompt = (
        f"Item: {item_name} at {merchant}, RM{amount:.2f}, category: {category}.\n"
        "Return ONLY valid JSON with keys fomo_validation and trap_exposure. "
        "fomo_validation: 1-2 sentences validating the FOMO feeling in Manglish (warm, relatable). "
        "trap_exposure: 1-2 sentences exposing the psychological or financial trap in Manglish (honest but not preachy)."
    )

    response = await client.messages.create(
        model=model,
        max_tokens=300,
        system=(
            "You are BajetBuddy, a Malaysian financial advisor who speaks Manglish — "
            "a mix of English, Malay, and light Cantonese. "
            "You are warm, honest, and never judgmental. "
            "Respond ONLY with valid JSON, no markdown fences."
        ),
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text  # type: ignore[index]
    return json.loads(_strip_fences(raw))


def _build_cash_option(amount: float, current_balance: float, days_until_salary: int) -> FOMOOption:
    balance_after = current_balance - amount
    daily_after = balance_after / max(days_until_salary, 1)
    risky = balance_after <= 0 or daily_after < _SAFE_DAILY_FLOOR
    return FOMOOption(
        label="Buy with Cash",
        icon="💵",
        impact_summary=f"Balance: RM{balance_after:.2f} → RM{daily_after:.2f}/day for {days_until_salary}d",
        warning="" if not risky else f"Only RM{daily_after:.2f}/day left — makan pun susah lah",
        xp_delta=0,
        recommended=not risky,
    )


def _build_bnpl_option(amount: float, bnpl_load: float, current_balance: float) -> FOMOOption:
    new_bnpl = bnpl_load + amount
    risky = bnpl_load > _BNPL_DANGER_THRESHOLD or current_balance < amount * 0.5
    return FOMOOption(
        label="Use BNPL",
        icon="💳",
        impact_summary=f"BNPL commitment this month: RM{new_bnpl:.2f}",
        warning="" if not risky else f"BNPL dah RM{bnpl_load:.2f} — adding more is a trap lah",
        xp_delta=-5,
        recommended=False,
    )


def _build_walk_away_option(cash_risky: bool, bnpl_risky: bool) -> FOMOOption:
    return FOMOOption(
        label="Walk Away (12h cooldown)",
        icon="🚶",
        impact_summary="Come back in 12 hours. If still want, then consider lah.",
        warning="",
        xp_delta=15,
        recommended=cash_risky or bnpl_risky,
    )


async def negotiate(request: FOMONegotiateRequest, user_id: str) -> FOMONegotiateResponse:
    state = _get_state(user_id)

    claude_data = await _call_claude(
        request.item_name, request.merchant, request.amount, request.category
    )

    cash_opt = _build_cash_option(request.amount, request.current_balance, request.days_until_salary)
    bnpl_opt = _build_bnpl_option(request.amount, request.bnpl_load, request.current_balance)
    walk_opt = _build_walk_away_option(not cash_opt.recommended, not bnpl_opt.recommended)

    return FOMONegotiateResponse(
        fomo_validation=claude_data.get("fomo_validation", ""),
        trap_exposure=claude_data.get("trap_exposure", ""),
        option_cash=cash_opt,
        option_bnpl=bnpl_opt,
        option_walk_away=walk_opt,
        overspent_cards_used=state["overspent_cards_used"],
        tax_mode_active=state["tax_mode_active"],
        tax_rate_pct=state["tax_rate_pct"],
    )


async def resolve(request: FOMOResolveRequest, user_id: str) -> FOMOResolveResponse:
    state = _get_state(user_id)
    now = datetime.now(tz=timezone.utc)

    tax_mode_triggered_now = False
    cooldown_until_str: str | None = None
    tax_amount: float | None = None

    # safe threshold: 30% of (daily floor × days) — use a fixed 7-day horizon for resolve
    safe_threshold = _SAFE_DAILY_FLOOR * 7 * _CARD_SPEND_RATIO

    if request.choice == "walk_away":
        xp_delta = 15
        cooldown_until = now + timedelta(hours=_COOLDOWN_HOURS)
        state["cooldown_until"] = cooldown_until
        cooldown_until_str = cooldown_until.isoformat()
        message = "Good call! Come back in 12 hours — kalau still nak beli, baru consider lah."
    else:
        xp_delta = 0 if request.choice == "cash" else -5

        if request.amount > safe_threshold and state["overspent_cards_used"] < _MAX_CARDS:
            state["overspent_cards_used"] += 1

        if state["overspent_cards_used"] >= _MAX_CARDS and not state["tax_mode_active"]:
            state["tax_mode_active"] = True
            tax_mode_triggered_now = True

        if state["tax_mode_active"]:
            tax_amount = request.amount * (state["tax_rate_pct"] / 100)

        cards_left = _MAX_CARDS - state["overspent_cards_used"]
        if tax_mode_triggered_now:
            message = (
                f"Tax Mode activated! RM{tax_amount:.2f} auto-goes to savings. "
                "Dah habis semua overspent cards bro."
            )
        elif state["tax_mode_active"]:
            message = (
                f"Tax Mode active — RM{tax_amount:.2f} diverted to savings automatically."
            )
        else:
            message = (
                f"Okay lah. {cards_left} overspent card(s) remaining this cycle — jaga-jaga."
            )

    return FOMOResolveResponse(
        overspent_cards_used=state["overspent_cards_used"],
        tax_mode_active=state["tax_mode_active"],
        tax_mode_triggered_now=tax_mode_triggered_now,
        xp_delta=xp_delta,
        message=message,
        cooldown_until=cooldown_until_str,
        tax_amount=tax_amount,
    )


async def get_fomo_state(user_id: str) -> dict:
    state = _get_state(user_id)
    cooldown = state["cooldown_until"]
    return {
        "overspent_cards_used": state["overspent_cards_used"],
        "tax_mode_active": state["tax_mode_active"],
        "tax_rate_pct": state["tax_rate_pct"],
        "cooldown_until": cooldown.isoformat() if cooldown else None,
    }
