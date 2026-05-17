"""Freeze service — persists to Supabase freeze_events table."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
import logging

from app.core.database import get_supabase
from app.services.gamification_service import spend_xp

logger = logging.getLogger(__name__)

DEFAULT_STATE: dict = {
    "active": False,
    "type": "soft",
    "reason": "manual",
    "message": "Account is active.",
    "can_override": True,
    "override_cost_xp": 50,
    "activated_at": None,
}


def _latest_active(user_id: str) -> dict | None:
    """Return the most recent active (not released) freeze event from Supabase."""
    supabase = get_supabase()
    if supabase is None:
        return None
    try:
        res = (
            supabase.table("freeze_events")
            .select("*")
            .eq("user_id", user_id)
            .is_("released_at", "null")
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        if hasattr(res, "data") and res.data and len(res.data) > 0:
            row = res.data[0]
            return {
                "active": True,
                "type": row.get("freeze_type", "soft"),
                "reason": row.get("trigger_source", "manual"),
                "message": row.get("note", "Freeze active."),
                "can_override": row.get("freeze_type", "soft") == "soft",
                "override_cost_xp": 50,
                "activated_at": row.get("started_at"),
            }
    except Exception as e:
        logger.warning("Failed to fetch freeze status from Supabase: %s", e)
    return None


def get_freeze_status(user_id: str = "00000000-0000-0000-0000-000000000001") -> dict:
    """Returns current freeze status, preferring Supabase over defaults."""
    active = _latest_active(user_id)
    if active is not None:
        return active
    return DEFAULT_STATE.copy()


def activate_freeze(
    user_id: str = "00000000-0000-0000-0000-000000000001",
    freeze_type: Literal["soft", "hard"] = "soft",
) -> dict:
    """Activate a freeze — inserts into freeze_events table."""
    now = datetime.now(timezone.utc).isoformat()
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
        "activated_at": now,
    }

    supabase = get_supabase()
    if supabase is not None:
        try:
            supabase.table("freeze_events").insert({
                "user_id": user_id,
                "freeze_type": freeze_type,
                "trigger_source": "manual",
                "note": state["message"],
                "started_at": now,
            }).execute()
        except Exception as e:
            logger.warning("Failed to persist freeze to Supabase: %s", e)

    return state


def override_freeze(user_id: str = "00000000-0000-0000-0000-000000000001") -> dict:
    """Override (release) the active freeze — sets released_at."""
    current = get_freeze_status(user_id)
    if not current.get("can_override", True):
        raise ValueError("Hard freeze cannot be overridden")

    spend_xp(user_id, int(current.get("override_cost_xp", 0)))

    now = datetime.now(timezone.utc).isoformat()
    supabase = get_supabase()
    if supabase is not None:
        try:
            supabase.table("freeze_events") \
                .update({"released_at": now}) \
                .eq("user_id", user_id) \
                .is_("released_at", "null") \
                .execute()
        except Exception as e:
            logger.warning("Failed to release freeze in Supabase: %s", e)

    return DEFAULT_STATE.copy()


def maybe_trigger_auto_freeze(
    user_id: str = "00000000-0000-0000-0000-000000000001",
    *,
    risk_score: int,
    projected_daily_survival_amount: float,
    days_until_salary: int,
) -> dict:
    """Autonomously freeze when runway turns critical."""
    if projected_daily_survival_amount < 25 or risk_score >= 90:
        ft: Literal["soft", "hard"] = "soft" if days_until_salary <= 7 else "hard"
        return activate_freeze(user_id, ft)
    return get_freeze_status(user_id)
