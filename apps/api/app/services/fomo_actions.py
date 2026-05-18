from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from app.schemas.fomo import EmotionalState
from app.services import gamification_service, pet_companion_service

FOMOChoice = Literal["cash", "bnpl", "walk_away"]

# ─── In-memory FOMO outcome journal (survives process lifetime) ──────────────
_fomo_journal: list[dict] = []

# ─── PWA monitor state ───────────────────────────────────────────────────────
# Keyed by user_id. When BNPL is chosen, pwa_bnpl_monitor = True.
# When the frontend reports that the user opened Shopee/Lazada, we check this.
_pwa_monitors: dict[str, dict] = {}

SHOPEE_LAZADA_DOMAINS = [
    "shopee.com.my", "shopee.sg", "shopee.co.id",
    "lazada.com.my", "lazada.sg",
]


def get_fomo_journal() -> list[dict]:
    """Return the full FOMO decision journal (for agent analysis)."""
    return list(_fomo_journal)


def get_user_journal(user_id: str) -> list[dict]:
    """Return FOMO decisions for a specific user."""
    return [entry for entry in _fomo_journal if entry.get("user_id") == user_id]


def is_bnpl_monitor_active(user_id: str) -> bool:
    """Check whether a BNPL monitor session is active for this user."""
    monitor = _pwa_monitors.get(user_id, {})
    if not monitor.get("active"):
        return False
    expires = monitor.get("expires_at")
    if expires:
        try:
            expiry = datetime.fromisoformat(expires)
            if datetime.now(timezone.utc) > expiry:
                _pwa_monitors[user_id] = {"active": False}
                return False
        except (ValueError, TypeError):
            pass
    return True


def get_bnpl_monitor_state(user_id: str) -> dict:
    """Return the current PWA monitor state for this user."""
    monitor = _pwa_monitors.get(user_id, {"active": False})
    return {
        "active": is_bnpl_monitor_active(user_id),
        "amount_rm": monitor.get("amount_rm", 0),
        "category": monitor.get("category", ""),
        "lockdown_triggered": monitor.get("lockdown_triggered", False),
        "lockdown_message": monitor.get("lockdown_message", ""),
    }


def report_app_opened(user_id: str, domain: str) -> dict:
    """
    Called by the PWA frontend when the user opens another app/site.

    If BNPL monitor is active and the domain matches Shopee/Lazada,
    return a lockdown response.
    """
    if not is_bnpl_monitor_active(user_id):
        return {"lockdown": False, "message": "No active BNPL monitor"}

    domain_lower = domain.lower()
    is_shopping_app = any(d in domain_lower for d in SHOPEE_LAZADA_DOMAINS)

    if not is_shopping_app:
        return {"lockdown": False, "message": f"Domain {domain} is not a monitored shopping app"}

    monitor = _pwa_monitors.setdefault(user_id, {})
    amount = monitor.get("amount_rm", 0)
    category = monitor.get("category", "shopping")

    lockdown_msg = (
        f"🛑 WOI STOP RIGHT THERE! 🛑\n\n"
        f"You just chose BNPL for RM{amount:.2f} ({category}) — "
        f"and now you're opening {domain}??\n\n"
        f"BajetBuddy has LOCKED your spending for 30 minutes. "
        f"Go breathe. Touch some grass. Your future self will thank you.\n\n"
        f"This is not a punishment — it's a promise you made to yourself."
    )

    monitor["lockdown_triggered"] = True
    monitor["lockdown_message"] = lockdown_msg

    return {
        "lockdown": True,
        "message": lockdown_msg,
        "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
    }


def clear_lockdown(user_id: str) -> dict:
    """Clear the lockdown after the user acknowledges it."""
    _pwa_monitors[user_id] = {"active": False}
    return {"lockdown": False, "message": "Lockdown cleared"}


async def dispatch_fomo_outcome(
    user_id: str,
    choice: FOMOChoice,
    amount: float,
    category: str,
    emotional_state: EmotionalState,
    merchant: str = "",
    item_name: str = "",
) -> dict:
    """
    Fan out a FOMO decision to every relevant AI agent.
    Returns a summary of what each agent did.
    """
    now = datetime.now(timezone.utc)
    results: dict[str, dict] = {}

    # ── 1. Gamification: award XP ─────────────────────────────────────────
    xp_map = {"walk_away": 20, "cash": 0, "bnpl": -5}
    xp_delta = xp_map.get(choice, 0)
    try:
        game_result = gamification_service.award_xp(user_id, xp=xp_delta)
        results["gamification"] = {"xp_delta": xp_delta, "new_status": game_result}
    except Exception as exc:
        results["gamification"] = {"error": str(exc)}

    # ── 2. Pet Companion: mood update ─────────────────────────────────────
    pet_context_map = {
        "walk_away": "savings_goal_met",
        "cash": "impulse_spend",
        "bnpl": "impulse_spend",
    }
    pet_context = pet_context_map.get(choice, "impulse_spend")
    try:
        pet_result = await pet_companion_service.award_xp(
            user_id, f"fomo_{choice}", amount
        )
        results["pet"] = {"context": pet_context, "award": pet_result.model_dump() if pet_result else None}
    except Exception as exc:
        results["pet"] = {"error": str(exc)}

    # ── 3. FOMO Journal: record for persona/sentinel analysis ─────────────
    entry = {
        "timestamp": now.isoformat(),
        "user_id": user_id,
        "choice": choice,
        "amount_rm": amount,
        "category": category,
        "emotional_state": emotional_state,
        "merchant": merchant,
        "item_name": item_name,
    }
    _fomo_journal.append(entry)
    if len(_fomo_journal) > 500:
        _fomo_journal[:] = _fomo_journal[-500:]  # keep last 500
    results["journal"] = {"recorded": True, "total_entries": len(_fomo_journal)}

    # ── 4. BNPL: activate PWA monitor ────────────────────────────────────
    if choice == "bnpl":
        _pwa_monitors[user_id] = {
            "active": True,
            "amount_rm": amount,
            "category": category,
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "lockdown_triggered": False,
            "lockdown_message": "",
        }
        results["pwa_monitor"] = {
            "active": True,
            "expires_in_hours": 24,
            "message": "BNPL monitor activated — opening Shopee/Lazada within 24h will trigger lockdown",
        }
    elif choice == "walk_away":
        # Clear any existing monitor since user made a good choice
        _pwa_monitors.pop(user_id, None)
        results["pwa_monitor"] = {"active": False, "message": "Monitor cleared — good decision!"}
    else:
        results["pwa_monitor"] = {"active": False}

    # ── 5. Pattern Detection: log the impulse event ──────────────────────
    try:
        from app.services.pattern_detection_service import detect_patterns, TransactionSummary
        tx = TransactionSummary(
            category=category,
            amount=amount,
            hour_of_day=now.hour,
            day_of_month=now.day,
            used_bnpl=(choice == "bnpl"),
        )
        pattern_result = await detect_patterns(user_id, [tx])
        results["pattern_detection"] = {
            "primary_pattern": pattern_result.primary_pattern,
            "risk_insight": pattern_result.risk_insight,
        }
    except Exception as exc:
        results["pattern_detection"] = {"error": str(exc)}

    return results
