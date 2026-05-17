"""Spending persona detection."""

from app.services.persona_analyzer import analyze_persona


def detect_persona(category_spends: dict[str, float]) -> str:
    """Simple rule-based persona detection from category spend map."""
    shopping = category_spends.get("shopping", 0)
    food = category_spends.get("food", 0)
    transport = category_spends.get("transport", 0)
    entertainment = category_spends.get("entertainment", 0)

    if shopping > 500:
        return "midnight_shopee_queen"
    if food > 600:
        return "grabfood_spiral"
    if transport > 400:
        return "gaji_habis_king"
    if entertainment > 300:
        return "bubble_tea_bro"
    return "savings_starter"


def get_persona_info(persona_type: str) -> dict:
    return analyze_persona(
        transactions=[],
        monthly_income=3200,
        current_balance=340,
        bnpl_commitments=0,
        days_until_salary=7,
    )["persona"].model_dump()


def learn_persona_from_transaction_signals(
    transactions: list[dict],
    onboarding_data: dict | None = None,
    savings_rate: float | None = None,
    active_subscriptions: int = 0,
    bnpl_commitments: int = 0,
    monthly_income: float = 3200,
    current_balance: float = 340,
) -> dict:
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
