"""
Budget calculations — works with mock data when Supabase is not configured.
"""
from datetime import date


MOCK_BUDGET = {
    "total_income": 3200.0,
    "total_spent": 2860.0,
    "remaining": 340.0,
    "days_left": 7,
    "daily_safe_amount": 48.57,
}

MOCK_CATEGORIES = [
    {"id": "food", "name": "Food & Drinks", "emoji": "🍜", "allocated": 800.0, "spent": 680.0, "color": "#16a34a"},
    {"id": "transport", "name": "Transport", "emoji": "🚗", "allocated": 400.0, "spent": 320.0, "color": "#2563eb"},
    {"id": "shopping", "name": "Shopping", "emoji": "🛍️", "allocated": 600.0, "spent": 950.0, "color": "#dc2626"},
    {"id": "entertainment", "name": "Entertainment", "emoji": "🎮", "allocated": 200.0, "spent": 180.0, "color": "#9333ea"},
    {"id": "utilities", "name": "Utilities", "emoji": "💡", "allocated": 250.0, "spent": 210.0, "color": "#d97706"},
]


def get_budget_summary(user_id: str | None = None) -> dict:
    """Return budget summary. Falls back to mock data."""
    return MOCK_BUDGET.copy()


def get_category_budgets(user_id: str | None = None) -> list[dict]:
    return MOCK_CATEGORIES.copy()


def calculate_risk_score(amount: float, remaining: float, category: str) -> int:
    """
    Simple rule-based risk score (0-100).
    The LangGraph agent enriches this with Claude when available.
    """
    if remaining <= 0:
        return 100

    impact_pct = (amount / remaining) * 100

    # Base score from budget impact
    if impact_pct >= 80:
        base = 85
    elif impact_pct >= 50:
        base = 60
    elif impact_pct >= 30:
        base = 40
    else:
        base = 15

    # Category modifier
    high_risk_cats = {"shopping", "entertainment"}
    if category in high_risk_cats:
        base = min(100, base + 10)

    return int(base)


def get_verdict(risk_score: int) -> str:
    if risk_score >= 70:
        return "jangan_dulu"
    elif risk_score >= 40:
        return "fikir_dulu"
    return "boleh"
