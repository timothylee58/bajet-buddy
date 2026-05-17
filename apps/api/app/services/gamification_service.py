"""In-memory XP, level, and streak logic for the demo environment."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TypedDict
import logging
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

XP_TABLE = {
    "boleh": 10,
    "fikir_dulu": 5,
    "jangan_dulu": 0,
}

LEVELS = [
    (1, 0, 200, "Bajet Baru"),
    (2, 200, 500, "Jimat Sikit"),
    (3, 500, 1000, "Duit Savvy"),
    (4, 1000, 2000, "Budget Pro"),
    (5, 2000, 999999, "BajetBuddy Legend"),
]

DEFAULT_GAMIFICATION = {
    "xp": 420,
    "streak": 7,
    "last_active_date": date(2026, 5, 16),
}


class GamificationState(TypedDict):
    xp: int
    streak: int
    last_active_date: date | None


_gamification_store: dict[str, GamificationState] = {}


def xp_for_verdict(verdict: str) -> int:
    return XP_TABLE.get(verdict, 0)


def level_for_xp(xp: int) -> tuple[int, str, int, int]:
    """Returns (level, name, min_xp, max_xp)."""
    for level, min_xp, max_xp, name in LEVELS:
        if min_xp <= xp < max_xp:
            return level, name, min_xp, max_xp
    return 5, "BajetBuddy Legend", 2000, 999999


def _get_state(user_id: str) -> GamificationState:
    # Try to fetch from Supabase first if it's not the "demo" user
    if user_id != "demo":
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("user_gamification").select("*").eq("user_id", user_id).maybe_single().execute()
                if res.data:
                    return {
                        "xp": res.data.get("xp", 0),
                        "streak": res.data.get("streak_days", 0),
                        "last_active_date": date.fromisoformat(res.data["updated_at"][:10]) if res.data.get("updated_at") else None
                    }
            except Exception as e:
                logger.error(f"Failed to fetch gamification from Supabase: {e}")

    if user_id not in _gamification_store:
        _gamification_store[user_id] = DEFAULT_GAMIFICATION.copy()
    return _gamification_store[user_id]


def _update_streak(state: GamificationState, action_date: date) -> None:
    last_active = state.get("last_active_date")
    if last_active is None:
        state["streak"] = max(state["streak"], 1)
    elif action_date == last_active:
        return
    elif action_date.toordinal() - last_active.toordinal() == 1:
        state["streak"] += 1
    else:
        state["streak"] = 1
    state["last_active_date"] = action_date


def get_gamification_status(user_id: str = "demo") -> dict:
    state = _get_state(user_id)
    level, name, min_xp, max_xp = level_for_xp(state["xp"])
    return {
        "xp": state["xp"],
        "streak": state["streak"],
        "level": level,
        "level_name": name,
        "level_min_xp": min_xp,
        "xp_to_next": max_xp,
        "progress_pct": round(((state["xp"] - min_xp) / max(max_xp - min_xp, 1)) * 100, 1),
        "last_active_date": state["last_active_date"].isoformat() if state["last_active_date"] else (state["last_active_date"] if isinstance(state["last_active_date"], str) else None),
    }


def award_xp_for_verdict(
    user_id: str = "demo",
    verdict: str = "boleh",
    *,
    action_at: datetime | None = None,
) -> dict:
    xp_delta = xp_for_verdict(verdict)
    state = _get_state(user_id)
    action_date = (action_at or datetime.now(timezone.utc)).date()
    _update_streak(state, action_date)
    state["xp"] += xp_delta
    return {
        "xp_earned": xp_delta,
        "status": get_gamification_status(user_id),
    }


def award_xp(user_id: str = "demo", xp: int = 0) -> dict:
    state = _get_state(user_id)
    state["xp"] += xp
    return {
        "xp_earned": xp,
        "status": get_gamification_status(user_id),
    }


def spend_xp(user_id: str = "demo", cost: int = 0) -> dict:
    state = _get_state(user_id)
    if state["xp"] < cost:
        raise ValueError("Not enough XP to override the freeze")
    state["xp"] -= cost
    return get_gamification_status(user_id)
