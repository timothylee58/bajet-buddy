from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from app.nudge_agent.service import (
    BnplContextPayload,
    BudgetContextPayload,
    NudgeRequestModel,
    PersonaPayload,
    TransactionIntentPayload,
    UserProfilePayload,
    generate_nudge_package,
)
from app.risk_engine import RiskEvaluationInput, evaluate_risk
from app.services.budget_service import (
    fetch_work_hours_profile,
    get_budget_summary,
    get_category_budgets,
)
from app.services.freeze_service import maybe_trigger_auto_freeze
from app.services.hourly_rate_service import (
    amount_to_life_hours,
    compute_real_hourly_rate,
    format_life_hours_my,
)
from app.services.persona_service import learn_persona_from_transaction_signals


@dataclass(slots=True)
class GraphState:
    payload: Any
    user_id: str
    now: datetime
    trace: list[str] = field(default_factory=list)
    user_profile: dict[str, Any] = field(default_factory=dict)
    budget_summary: dict[str, Any] = field(default_factory=dict)
    category_budget: dict[str, Any] = field(default_factory=dict)
    persona: dict[str, Any] = field(default_factory=dict)
    proactive_alert: bool = False
    proactive_reason: str | None = None
    risk_result: Any | None = None
    nudge_result: Any | None = None
    freeze_status: dict[str, Any] | None = None
    real_hourly_rate: float = 0.0
    life_hours_cost: float = 0.0
    life_hours_str: str = ""


def _demo_transaction_signals(now: datetime, category: str) -> list[dict[str, Any]]:
    if category in {"food", "health", "utilities", "transport"}:
        return [
            {"category": "food", "amount": 18, "timestamp": now - timedelta(days=1, hours=12), "merchant": "FamilyMart"},
            {"category": "transport", "amount": 11, "timestamp": now - timedelta(days=2, hours=8), "merchant": "RapidKL"},
            {"category": "utilities", "amount": 35, "timestamp": now - timedelta(days=5, hours=10), "merchant": "TNB"},
            {"category": "health", "amount": 22, "timestamp": now - timedelta(days=8, hours=15), "merchant": "Guardian"},
        ]
    return [
        {"category": "shopping", "amount": 92, "timestamp": now - timedelta(days=1, hours=1), "merchant": "Shopee Malaysia"},
        {"category": "shopping", "amount": 74, "timestamp": now - timedelta(days=2, hours=1), "merchant": "TikTok Shop"},
        {"category": "food", "amount": 18, "timestamp": now - timedelta(days=1, hours=12), "merchant": "FamilyMart"},
        {"category": "transport", "amount": 12, "timestamp": now - timedelta(days=3, hours=9), "merchant": "Grab"},
        {"category": "shopping", "amount": 146, "timestamp": now - timedelta(days=6, hours=2), "merchant": "Lazada"},
    ]


async def _get_category_budget(category: str, user_id: str) -> dict[str, Any]:
    cats = await get_category_budgets(user_id)
    for item in cats:
        if item["id"] == category:
            return item
    return {"id": category, "name": category.title(), "allocated": 300.0, "spent": 120.0, "emoji": "📦", "color": "#64748b"}


def _detect_proactive_pattern(now: datetime, persona_type: str, category: str, amount: float) -> tuple[bool, str | None]:
    hour = now.hour
    if (hour >= 22 or hour < 2) and persona_type == "midnight_shopee_queen":
        return True, "Late-night shopping pattern detected"
    if category == "shopping" and amount >= 120 and hour >= 20:
        return True, "High discretionary spend detected during impulse-prone hours"
    return False, None


async def _observe_transaction_intent(state: GraphState) -> GraphState:
    state.trace.append("observe_transaction_intent")
    # Build user profile from database or defaults — includes onboarding context
    state.user_profile = {
        "name": "Sarah",
        "age": 26,
        "occupation": "Fresh grad",
        "monthly_income": 3200.0,
        # Onboarding answers (would come from DB in production)
        "onboarding": {
            "spending_style": "I tend to impulse-buy when I'm stressed or bored",
            "biggest_expense": "Online shopping and food delivery",
            "savings_goal": "Save for a house down payment",
            "impulse_rating": 4,
        },
        # Financial context
        "savings_rate": 0.08,  # 8% of income saved monthly
        "active_subscriptions": 3,  # Netflix, Spotify, phone plan
        "bnpl_commitments": 2,
    }
    return state


async def _load_context(state: GraphState) -> GraphState:
    state.trace.append("load_context")
    state.budget_summary = await get_budget_summary(state.user_id)
    state.category_budget = await _get_category_budget(state.payload.category, state.user_id)
    profile = state.user_profile
    persona = learn_persona_from_transaction_signals(
        _demo_transaction_signals(state.now, state.payload.category),
        onboarding_data=profile.get("onboarding"),
        savings_rate=profile.get("savings_rate"),
        active_subscriptions=profile.get("active_subscriptions", 0),
        bnpl_commitments=profile.get("bnpl_commitments", 0),
        monthly_income=profile.get("monthly_income", 3200),
        current_balance=state.budget_summary.get("remaining", 340),
    )
    state.persona = persona
    proactive_alert, proactive_reason = _detect_proactive_pattern(
        state.now,
        persona["type"],
        state.payload.category,
        state.payload.amount,
    )
    state.proactive_alert = proactive_alert
    state.proactive_reason = proactive_reason

    # Life-hours framing
    commute, overtime = await fetch_work_hours_profile(state.user_id)
    monthly_income = state.budget_summary.get("total_income") or profile.get("monthly_income", 3200)
    state.real_hourly_rate = compute_real_hourly_rate(monthly_income, commute, overtime)
    state.life_hours_cost = amount_to_life_hours(state.payload.amount, state.real_hourly_rate)
    state.life_hours_str = format_life_hours_my(state.life_hours_cost)

    return state


async def _evaluate_risk_node(state: GraphState) -> GraphState:
    state.trace.append("evaluate_risk")
    budget = state.budget_summary
    category = state.category_budget
    bnpl_due_this_month = 214.0
    bnpl_due_within_7_days = 89.0 if state.payload.category == "shopping" else 0.0
    state.risk_result = evaluate_risk(
        RiskEvaluationInput(
            amount=state.payload.amount,
            category=state.payload.category,
            merchant=state.payload.merchant,
            merchant_type="essential" if state.payload.essential else state.payload.merchant_type,
            purchase_at=state.payload.purchase_at or state.now,
            current_balance=budget["remaining"],
            days_until_salary=budget["days_left"],
            current_daily_survival_amount=budget["daily_safe_amount"],
            category_budget_allocated=category["allocated"],
            category_budget_spent=category["spent"],
            bnpl_due_this_month=0.0 if state.payload.essential else bnpl_due_this_month,
            bnpl_due_within_7_days=0.0 if state.payload.essential else bnpl_due_within_7_days,
            uses_bnpl=getattr(state.payload, "bnpl", False),
            has_midnight_spending_pattern=state.persona["type"] == "midnight_shopee_queen",
            historical_behaviour_score=max(
                10,
                state.persona["historical_behaviour_score"] - (25 if state.payload.essential else 0),
            ),
        )
    )
    return state


async def _generate_nudge_node(state: GraphState) -> GraphState:
    state.trace.append("generate_nudge")
    budget = state.budget_summary
    category = state.category_budget
    risk = state.risk_result
    profile = state.user_profile
    state.nudge_result = await generate_nudge_package(
        NudgeRequestModel(
            user_profile=UserProfilePayload(
                name=profile.get("name", "User"),
                age=profile.get("age"),
                occupation=profile.get("occupation"),
                monthly_income=profile.get("monthly_income"),
            ),
            transaction_intent=TransactionIntentPayload(
                amount=state.payload.amount,
                merchant=state.payload.merchant,
                category=state.payload.category,
                merchant_type="essential" if state.payload.essential else state.payload.merchant_type,
                item_name=state.payload.item_name,
                essential=state.payload.essential,
                uses_bnpl=getattr(state.payload, "bnpl", False),
            ),
            risk_score=risk.risk_score,
            budget_context=BudgetContextPayload(
                current_balance=budget["remaining"],
                days_until_salary=budget["days_left"],
                current_daily_survival_amount=budget["daily_safe_amount"],
                projected_remaining_balance=risk.projected_remaining_balance,
                projected_daily_survival_amount=risk.projected_daily_survival_amount,
                category_budget_usage_pct=((category["spent"] + state.payload.amount) / max(category["allocated"], 1)) * 100,
                total_monthly_spending=budget["total_spent"],
            ),
            bnpl_context=BnplContextPayload(
                due_this_month=214.0,
                due_within_7_days=89.0 if state.payload.category == "shopping" else 0.0,
                active_commitments=3,
            ),
            user_persona=PersonaPayload(
                code=state.persona["type"],
                label=state.persona["name"],
                description=state.persona["description"],
            ),
            language_preference=state.payload.language_preference,
            tone_mode=state.payload.tone_mode,
            reason_codes=risk.reason_codes,
            life_hours_str=state.life_hours_str,
            real_hourly_rate=state.real_hourly_rate,
        )
    )
    return state


async def _finalize_action_node(state: GraphState) -> GraphState:
    state.trace.append("finalize_action")
    state.freeze_status = maybe_trigger_auto_freeze(
        state.user_id,
        risk_score=state.risk_result.risk_score,
        projected_daily_survival_amount=state.risk_result.projected_daily_survival_amount,
        days_until_salary=state.budget_summary["days_left"],
    )
    return state


async def run_prepurchase_reasoning_graph(payload: Any, user_id: str = "00000000-0000-0000-0000-000000000001") -> GraphState:
    now = payload.purchase_at or datetime.now(timezone.utc)
    state = GraphState(payload=payload, user_id=user_id, now=now)
    for node in (
        _observe_transaction_intent,
        _load_context,
        _evaluate_risk_node,
        _generate_nudge_node,
        _finalize_action_node,
    ):
        state = await node(state)
    return state
