"""In-memory freeze state (replace with DB in production)."""
from datetime import datetime, timezone
from typing import Literal
from app.services.gamification_service import spend_xp

# Simple in-memory store — keyed by user_id
_freeze_store: dict[str, dict] = {}

DEFAULT_STATE = {
    "active": False,
    "type": "soft",
    "reason": "manual",
    "message": "Account is active.",
    "can_override": True,
    "override_cost_xp": 50,
    "activated_at": None,
}


def get_freeze_status(user_id: str = "demo") -> dict:
    return _freeze_store.get(user_id, DEFAULT_STATE.copy())


def activate_freeze(user_id: str = "demo", freeze_type: Literal["soft", "hard"] = "soft") -> dict:
    state = {
        "active": True,
        "type": freeze_type,
        "reason": "manual",
        "message": (
            "Soft freeze active — you can override in an emergency."
            if freeze_type == "soft"
            else "Hard freeze active — no overrides allowed."
        ),
        "can_override": freeze_type == "soft",
        "override_cost_xp": 50,
        "activated_at": datetime.now(timezone.utc).isoformat(),
    }
    _freeze_store[user_id] = state
    return state


def override_freeze(user_id: str = "demo") -> dict:
    state = _freeze_store.get(user_id, DEFAULT_STATE.copy())
    if not state.get("can_override", True):
        raise ValueError("Hard freeze cannot be overridden")
    spend_xp(user_id, int(state.get("override_cost_xp", 0)))
    _freeze_store[user_id] = DEFAULT_STATE.copy()
    return DEFAULT_STATE.copy()


def maybe_trigger_auto_freeze(
    user_id: str = "demo",
    *,
    risk_score: int,
    projected_daily_survival_amount: float,
    days_until_salary: int,
) -> dict:
    """Autonomously freeze when runway turns critical."""
    if projected_daily_survival_amount < 25 or risk_score >= 90:
        state = {
            "active": True,
            "type": "soft" if days_until_salary <= 7 else "hard",
            "reason": "auto",
            "message": (
                "Auto-freeze triggered because daily survival dropped below RM25."
                if projected_daily_survival_amount < 25
                else "Auto-freeze triggered because spending risk reached a critical level."
            ),
            "can_override": days_until_salary <= 7,
            "override_cost_xp": 50,
            "activated_at": datetime.now(timezone.utc).isoformat(),
        }
        _freeze_store[user_id] = state
        return state
    return get_freeze_status(user_id)
