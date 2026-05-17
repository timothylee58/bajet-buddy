from __future__ import annotations

from datetime import datetime, timezone, timedelta
import logging

from app.core.database import get_supabase
from app.schemas.persona import PersonaOut
from app.services.budget_service import get_budget_summary, _current_month_days
from app.services.persona_analyzer import PERSONAS, analyze_persona
from app.services.transaction_service import get_user_transactions

logger = logging.getLogger(__name__)

REROLL_COOLDOWN_DAYS = 7


def _parse_datetime(value: str | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _persona_level_from_xp(xp: int) -> tuple[int, int]:
    level = 2 if xp < 500 else 3 if xp < 1000 else 4
    xp_to_next = 500 if level == 2 else 1000 if level == 3 else 2000
    return level, xp_to_next


async def _fetch_profile(user_id: str) -> dict:
    supabase = get_supabase()
    if supabase is None:
        return {
            "monthly_income": 3200.0,
            "persona_last_reroll_at": None,
        }
    try:
        res = (
            supabase.table("profiles")
            .select("monthly_income, persona_last_reroll_at")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        if res.data:
            return res.data
    except Exception as exc:
        logger.warning("Failed to fetch profile for %s: %s", user_id, exc)
    return {
        "monthly_income": 3200.0,
        "persona_last_reroll_at": None,
    }


async def _fetch_gamification(user_id: str) -> dict:
    supabase = get_supabase()
    if supabase is None:
        return {"xp": 420, "streak": 7}
    try:
        res = (
            supabase.table("user_gamification")
            .select("xp, streak_days")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if res.data:
            return {
                "xp": int(res.data.get("xp") or 0),
                "streak": int(res.data.get("streak_days") or 0),
            }
    except Exception as exc:
        logger.warning("Failed to fetch gamification for %s: %s", user_id, exc)
    return {"xp": 420, "streak": 7}


async def _fetch_bnpl_commitments(user_id: str) -> int:
    supabase = get_supabase()
    if supabase is None:
        return 0
    try:
        res = (
            supabase.table("bnpl_commitments")
            .select("id, status")
            .eq("user_id", user_id)
            .execute()
        )
        if res.data:
            return sum(1 for item in res.data if item.get("status") in {"active", "late"})
    except Exception as exc:
        logger.warning("Failed to fetch BNPL commitments for %s: %s", user_id, exc)
    return 0


def _normalize_transactions(rows: list[dict]) -> list[dict]:
    normalized: list[dict] = []
    for row in rows:
        created_at = _parse_datetime(row.get("created_at")) or datetime.now(timezone.utc)
        amount_raw = row.get("amount", 0)
        try:
            amount = abs(float(amount_raw))
        except (TypeError, ValueError):
            amount = 0.0
        normalized.append(
            {
                "category": row.get("category") or "other",
                "merchant": row.get("merchant") or "Unknown",
                "amount": amount,
                "created_at": created_at,
                "bnpl": False,
            }
        )
    return normalized


async def _fetch_latest_snapshot(user_id: str) -> dict | None:
    supabase = get_supabase()
    if supabase is None:
        return None
    try:
        res = (
            supabase.table("persona_snapshots")
            .select("*")
            .eq("user_id", user_id)
            .order("captured_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            return res.data[0]
    except Exception as exc:
        logger.warning("Failed to fetch persona snapshot for %s: %s", user_id, exc)
    return None


def _snapshot_to_persona(snapshot: dict, xp: int, streak: int) -> PersonaOut:
    persona_code = snapshot.get("persona_code") or "savings_starter"
    persona = PERSONAS.get(persona_code, PERSONAS["savings_starter"])
    level, xp_to_next = _persona_level_from_xp(xp)
    return PersonaOut(
        type=persona_code,
        name=snapshot.get("persona_name") or persona.name,
        emoji=persona.emoji,
        description=persona.description,
        level=level,
        xp=xp,
        xp_to_next=xp_to_next,
        streak=streak,
        explanation=snapshot.get("explanation") or "",
        suggested_intervention_rule=snapshot.get("suggested_intervention_rule") or persona.suggested_intervention_rule,
        confidence=int(snapshot.get("confidence") or 0),
        top_signals=list(snapshot.get("top_signals") or []),
    )


async def _save_snapshot(user_id: str, persona: PersonaOut) -> None:
    supabase = get_supabase()
    if supabase is None:
        return
    try:
        supabase.table("persona_snapshots").insert(
            {
                "user_id": user_id,
                "persona_code": persona.type,
                "persona_name": persona.name,
                "confidence": persona.confidence,
                "explanation": persona.explanation,
                "suggested_intervention_rule": persona.suggested_intervention_rule,
                "top_signals": persona.top_signals,
            }
        ).execute()
    except Exception as exc:
        logger.warning("Failed to store persona snapshot for %s: %s", user_id, exc)


async def _update_last_reroll(user_id: str, timestamp: datetime) -> None:
    supabase = get_supabase()
    if supabase is None:
        return
    try:
        supabase.table("profiles").update(
            {"persona_last_reroll_at": timestamp.isoformat()}
        ).eq("id", user_id).execute()
    except Exception as exc:
        logger.warning("Failed to update persona reroll timestamp for %s: %s", user_id, exc)


async def _analyze_persona_from_live_data(user_id: str) -> PersonaOut:
    transactions = await get_user_transactions(user_id)
    normalized = _normalize_transactions(transactions)

    profile = await _fetch_profile(user_id)
    monthly_income = float(profile.get("monthly_income") or 3200.0)

    budget_summary = await get_budget_summary(user_id)
    current_balance = float(budget_summary.get("remaining") or 0.0)

    _, _, days_left = _current_month_days()
    bnpl_commitments = await _fetch_bnpl_commitments(user_id)

    gamification = await _fetch_gamification(user_id)
    xp = gamification["xp"]
    streak = gamification["streak"]

    response = analyze_persona(
        transactions=normalized,
        monthly_income=monthly_income,
        current_balance=current_balance,
        bnpl_commitments=bnpl_commitments,
        days_until_salary=days_left,
        xp=xp,
        streak=streak,
    )
    return response["persona"]


async def get_persona_for_user(user_id: str) -> tuple[PersonaOut, dict]:
    profile = await _fetch_profile(user_id)
    last_reroll_at = _parse_datetime(profile.get("persona_last_reroll_at"))
    snapshot = await _fetch_latest_snapshot(user_id)

    if snapshot:
        gamification = await _fetch_gamification(user_id)
        persona = _snapshot_to_persona(snapshot, gamification["xp"], gamification["streak"])
    else:
        persona = await _analyze_persona_from_live_data(user_id)
        await _save_snapshot(user_id, persona)
        last_reroll_at = datetime.now(timezone.utc)
        await _update_last_reroll(user_id, last_reroll_at)

    next_reroll_at = None
    if last_reroll_at:
        next_reroll_at = last_reroll_at + timedelta(days=REROLL_COOLDOWN_DAYS)

    meta = {
        "last_reroll_at": last_reroll_at,
        "next_reroll_at": next_reroll_at,
        "cooldown_days": REROLL_COOLDOWN_DAYS,
    }
    return persona, meta


async def reroll_persona_for_user(user_id: str) -> tuple[str, PersonaOut | None, dict]:
    profile = await _fetch_profile(user_id)
    last_reroll_at = _parse_datetime(profile.get("persona_last_reroll_at"))
    now = datetime.now(timezone.utc)

    if last_reroll_at:
        next_allowed = last_reroll_at + timedelta(days=REROLL_COOLDOWN_DAYS)
        if now < next_allowed:
            return "cooldown", None, {
                "last_reroll_at": last_reroll_at,
                "next_reroll_at": next_allowed,
                "cooldown_days": REROLL_COOLDOWN_DAYS,
            }

    persona = await _analyze_persona_from_live_data(user_id)
    await _save_snapshot(user_id, persona)
    await _update_last_reroll(user_id, now)

    return "ok", persona, {
        "last_reroll_at": now,
        "next_reroll_at": now + timedelta(days=REROLL_COOLDOWN_DAYS),
        "cooldown_days": REROLL_COOLDOWN_DAYS,
    }


# ── Sync wrapper for reasoning graph compatibility ─────────────────────────

def learn_persona_from_transaction_signals(
    transactions: list[dict],
    onboarding_data: dict | None = None,
    savings_rate: float | None = None,
    active_subscriptions: int = 0,
    bnpl_commitments: int = 0,
    monthly_income: float = 3200,
    current_balance: float = 340,
) -> dict:
    """Build persona dict from transaction signals. Used by reasoning graph."""
    payload = analyze_persona(
        transactions=[
            {
                "category": item.get("category", "other"),
                "merchant": item.get("merchant", "Unknown"),
                "amount": float(item.get("amount", 0)),
                "created_at": item.get("timestamp"),
                "bnpl": bool(item.get("bnpl", False)),
            }
            for item in transactions
        ],
        monthly_income=monthly_income,
        current_balance=current_balance,
        bnpl_commitments=bnpl_commitments or sum(1 for item in transactions if item.get("bnpl")),
        days_until_salary=7,
        onboarding_data=onboarding_data,
        savings_rate=savings_rate,
        active_subscriptions=active_subscriptions,
    )["persona"]
    return {
        "type": payload.type,
        "name": payload.name,
        "emoji": payload.emoji,
        "description": payload.description,
        "confidence": payload.confidence,
        "historical_behaviour_score": max(25, min(95, payload.confidence - 5)),
        "explanation": payload.explanation,
        "suggested_intervention_rule": payload.suggested_intervention_rule,
        "top_signals": payload.top_signals,
    }
