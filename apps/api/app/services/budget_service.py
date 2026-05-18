"""Budget calculations — all data sourced from Supabase."""
from __future__ import annotations

import calendar
import logging
from datetime import datetime, timezone

from app.core.database import get_supabase
from app.services.transaction_service import get_user_transactions

logger = logging.getLogger(__name__)

CATEGORY_META: dict[str, dict] = {
    "food":          {"name": "Food & Drinks", "emoji": "🍜", "color": "#16a34a"},
    "transport":     {"name": "Transport",     "emoji": "🚗", "color": "#2563eb"},
    "shopping":      {"name": "Shopping",      "emoji": "🛍️", "color": "#dc2626"},
    "entertainment": {"name": "Entertainment", "emoji": "🎮", "color": "#9333ea"},
    "utilities":     {"name": "Utilities",     "emoji": "💡", "color": "#d97706"},
}


def _current_month_days() -> tuple[int, int, int]:
    """Return (current_day, total_days, days_left) for current month."""
    now = datetime.now(timezone.utc)
    total_days = calendar.monthrange(now.year, now.month)[1]
    current_day = now.day
    days_left = max(total_days - current_day, 1)
    return current_day, total_days, days_left


async def _fetch_monthly_income(user_id: str) -> float:
    """Fetch monthly_income from the profiles table."""
    supabase = get_supabase()
    if supabase is None:
        return 3200.0
    try:
        res = supabase.table("profiles").select("monthly_income").eq("id", user_id).maybe_single().execute()
        if hasattr(res, "data") and res.data and res.data.get("monthly_income"):
            return float(res.data["monthly_income"])
    except Exception as e:
        logger.warning("Failed to fetch income for %s: %s", user_id, e)
    return 3200.0


async def get_budget_summary(user_id: str | None = None) -> dict:
    """Return budget summary computed from real transactions and profile."""
    if not user_id:
        _, total_days, days_left = _current_month_days()
        return {
            "total_income": 0,
            "total_spent": 0,
            "remaining": 0,
            "days_left": days_left,
            "total_days": total_days,
            "daily_safe_amount": 0,
        }

    transactions = await get_user_transactions(user_id)

    # Prefer profile-declared income; fall back to summing income-category transactions.
    # Positive-amount non-income transactions (refunds, credits) are intentionally excluded
    # from the income total to avoid inflating the budget — they reduce spending instead.
    total_income = await _fetch_monthly_income(user_id)
    if total_income == 0:
        total_income = sum(t["amount"] for t in transactions if t.get("category") == "income")

    total_spent = sum(abs(t["amount"]) for t in transactions if t.get("category") != "income" and t.get("amount", 0) < 0)

    remaining = total_income - total_spent
    _, total_days, days_left = _current_month_days()

    return {
        "total_income": total_income,
        "total_spent": total_spent,
        "remaining": remaining,
        "days_left": days_left,
        "total_days": total_days,
        "daily_safe_amount": remaining / days_left if days_left > 0 else 0,
    }


async def get_category_budgets(user_id: str | None = None) -> list[dict]:
    """Fetch category budgets from DB, fall back to computed from transactions."""
    if not user_id:
        return []

    # Try real category_budgets table first
    supabase = get_supabase()
    if supabase is not None:
        try:
            month = datetime.now(timezone.utc).strftime("%Y-%m-01")
            res = (
                supabase.table("category_budgets")
                .select("*")
                .eq("user_id", user_id)
                .eq("month", month)
                .execute()
            )
            if hasattr(res, "data") and res.data:
                categories = []
                for row in res.data:
                    cat_id = row.get("category_id", "")
                    meta = CATEGORY_META.get(cat_id, {"name": cat_id, "emoji": "📦", "color": "#888"})
                    categories.append({
                        "id": cat_id,
                        "name": meta["name"],
                        "emoji": meta["emoji"],
                        "allocated": float(row.get("allocated", 0)),
                        "spent": float(row.get("spent", 0)),
                        "color": meta["color"],
                    })
                if categories:
                    return categories
        except Exception as e:
            logger.warning("Failed to fetch category budgets: %s", e)

    # Fallback: compute from transactions
    transactions = await get_user_transactions(user_id)
    computed: dict[str, dict] = {}
    for cat_id, meta in CATEGORY_META.items():
        computed[cat_id] = {
            "id": cat_id, "name": meta["name"], "emoji": meta["emoji"],
            "allocated": 0, "spent": 0, "color": meta["color"],
        }
    for t in transactions:
        cat_id = t.get("category", "other")
        if cat_id in computed and t.get("amount", 0) < 0:
            computed[cat_id]["spent"] += abs(t["amount"])

    return list(computed.values())


def calculate_risk_score(amount: float, remaining: float, category: str) -> int:
    if remaining <= 0:
        return 100
    impact_pct = (amount / remaining) * 100
    if impact_pct >= 80:
        base = 85
    elif impact_pct >= 50:
        base = 60
    elif impact_pct >= 30:
        base = 40
    else:
        base = 15
    if category in {"shopping", "entertainment"}:
        base = min(100, base + 10)
    return int(base)


def get_verdict(risk_score: int) -> str:
    if risk_score >= 70:
        return "jangan_dulu"
    elif risk_score >= 40:
        return "fikir_dulu"
    return "boleh"
