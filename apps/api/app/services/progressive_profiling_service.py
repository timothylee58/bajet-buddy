from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.schemas.profiling import (
    GoalProfileOut,
    GoalType,
    ProfilingLayerOut,
    ProgressiveProfilingSummaryOut,
    UnlockableAgentOut,
)
from app.services.gamification_service import get_gamification_status
from app.services.persona_analyzer import analyze_persona

_goal_store: dict[str, dict[str, int | str]] = {}

_seed_now = datetime(2026, 5, 17, 10, 0, tzinfo=timezone.utc)
_default_transactions = [
    {
        "category": "shopping",
        "merchant": "Shopee Malaysia",
        "amount": 189.0,
        "created_at": _seed_now - timedelta(days=1, hours=2),
        "bnpl": True,
    },
    {
        "category": "shopping",
        "merchant": "TikTok Shop",
        "amount": 74.0,
        "created_at": _seed_now - timedelta(days=2, hours=11),
        "bnpl": False,
    },
    {
        "category": "food",
        "merchant": "GrabFood",
        "amount": 29.0,
        "created_at": _seed_now - timedelta(days=4, hours=7),
        "bnpl": False,
    },
    {
        "category": "food",
        "merchant": "FamilyMart",
        "amount": 18.5,
        "created_at": _seed_now - timedelta(days=7, hours=4),
        "bnpl": False,
    },
    {
        "category": "social",
        "merchant": "Murni Discovery",
        "amount": 26.0,
        "created_at": _seed_now - timedelta(days=11, hours=6),
        "bnpl": False,
    },
    {
        "category": "shopping",
        "merchant": "Shopee Malaysia",
        "amount": 52.0,
        "created_at": _seed_now - timedelta(days=16, hours=1),
        "bnpl": False,
    },
]

_goal_labels: dict[GoalType, str] = {
    "emergency_fund": "Emergency fund",
    "debt_reduction": "Debt reduction",
    "home_savings": "Future home deposit",
    "no_spend": "No-spend buffer",
}


def _get_goal(user_id: str) -> dict[str, int | str] | None:
    return _goal_store.get(user_id)


def activate_goal(user_id: str, goal_type: GoalType, commitment_amount: int) -> dict[str, int | str]:
    goal = {
        "type": goal_type,
        "commitment_amount": commitment_amount,
    }
    _goal_store[user_id] = goal
    return goal


def build_progressive_profile_summary(
    user_id: str,
    *,
    monthly_income: float = 3200,
    current_balance: float = 340,
    days_until_salary: int = 7,
    transactions: list[dict] | None = None,
    bnpl_commitments: int = 2,
) -> ProgressiveProfilingSummaryOut:
    txs = transactions or list(_default_transactions)
    gamification = get_gamification_status(user_id)
    persona = analyze_persona(
        transactions=txs,
        monthly_income=monthly_income,
        current_balance=current_balance,
        bnpl_commitments=bnpl_commitments,
        days_until_salary=days_until_salary,
        xp=gamification["xp"],
        streak=gamification["streak"],
    )["persona"]

    oldest_tx = min(item["created_at"] for item in txs)
    days_observed = max((_seed_now.date() - oldest_tx.date()).days + 1, 1)
    top_signals = persona.top_signals[:3]
    goal = _get_goal(user_id)

    layer_0 = ProfilingLayerOut(
        id="layer_0",
        title="Layer 0 - Instant Gratification",
        status="complete",
        description="Belanja Guard gives a verdict before asking for profile depth.",
        value_unlocked="Instant spend check, nudge, and projected daily runway.",
        signals=[
            "Manual pre-purchase check returns a verdict in one action.",
            f"Current persona signal: {persona.name}.",
        ],
        cta="Run a spend check",
    )

    layer_1 = ProfilingLayerOut(
        id="layer_1",
        title="Layer 1 - Passive Capture",
        status="active",
        description="Transaction intent, merchants, categories, and timing are captured without extra forms.",
        value_unlocked="Budget heartbeat, transaction context, and passive merchant memory.",
        signals=[
            f"{len(txs)} transactions captured from real usage.",
            f"Top passive signals: {', '.join(top_signals) if top_signals else 'building context'}",
        ],
        cta="Keep using Belanja Guard",
    )

    layer_2_ready = days_observed >= 14
    layer_2 = ProfilingLayerOut(
        id="layer_2",
        title="Layer 2 - Recurring Pattern Detection",
        status="active" if layer_2_ready else "locked",
        description="Pattern detection only switches on after enough history exists to avoid fake certainty.",
        value_unlocked="Recurring payday, merchant, and late-night behaviour insights.",
        signals=(
            [
                f"{days_observed} days observed, recurring pattern detection enabled.",
                f"Detected persona: {persona.name}.",
                f"Primary intervention rule: {persona.suggested_intervention_rule}",
            ]
            if layer_2_ready
            else [
                f"{days_observed} days observed so far.",
                "Need at least 14 days before recurring behaviour is trusted.",
            ]
        ),
        cta="Keep checking spend for another week" if not layer_2_ready else "Review detected patterns",
    )

    goal_started = goal is not None
    goal_label = _goal_labels[goal["type"]] if goal_started else "No active goal yet"
    commitment_amount = int(goal["commitment_amount"]) if goal_started else 0
    layer_3 = ProfilingLayerOut(
        id="layer_3",
        title="Layer 3 - Goal-Directed Data",
        status="active" if goal_started else "available",
        description="High-commitment data is only requested when the user decides to pursue a goal.",
        value_unlocked="Goal-aware nudges, XP pacing, streak reinforcement, and AI agent unlocks.",
        signals=(
            [
                f"Goal activated: {goal_label}.",
                f"Committed amount: RM{commitment_amount}/month.",
                f"Current streak: {gamification['streak']} days.",
            ]
            if goal_started
            else [
                "No goal commitment collected yet.",
                "User can opt in when they want more personalised coaching.",
            ]
        ),
        cta="Start a savings goal" if not goal_started else "Adjust your goal",
    )

    goals = [
        GoalProfileOut(
            type=goal_type,
            label=label,
            commitment_label=(
                f"RM{commitment_amount}/month committed"
                if goal_started and goal["type"] == goal_type
                else "Not started"
            ),
            started=bool(goal_started and goal["type"] == goal_type),
            progress_label=(
                "Goal tracking is active in the nudge layer."
                if goal_started and goal["type"] == goal_type
                else "Unlock this when the user chooses a goal."
            ),
        )
        for goal_type, label in _goal_labels.items()
    ]

    unlockable_agents = [
        UnlockableAgentOut(
            code="salary_shield",
            label="Salary Shield",
            status="unlocked" if gamification["streak"] >= 3 else "ready",
            description="Hardens guardrails near payday dips and end-of-month pressure.",
            unlock_rule="Reach a 3-day streak",
            progress_label=f"{gamification['streak']}/3 streak days",
        ),
        UnlockableAgentOut(
            code="wishlist_negotiator",
            label="Wishlist Negotiator",
            status="unlocked" if goal_started else "ready" if layer_2_ready else "locked",
            description="Turns risky discretionary spends into delayed wishlist decisions.",
            unlock_rule="Activate one savings goal",
            progress_label="Goal active" if goal_started else "Needs one goal commitment",
        ),
        UnlockableAgentOut(
            code="pattern_detective",
            label="Pattern Detective",
            status="unlocked" if layer_2_ready else "locked",
            description="Explains repeated merchant, timing, and payday behaviour after enough history exists.",
            unlock_rule="Observe at least 14 days of data",
            progress_label=f"{days_observed}/14 days observed",
        ),
    ]

    profile_score = min(
        100,
        25
        + 20
        + (25 if layer_2_ready else 10)
        + (20 if goal_started else 5)
        + min(gamification["streak"], 10),
    )

    next_best_action = (
        "Ask for one savings goal next, because passive behaviour is already producing value."
        if not goal_started
        else "Keep reinforcing streaks and unlock the remaining AI agents from real behaviour."
    )

    return ProgressiveProfilingSummaryOut(
        profile_score=profile_score,
        principle="Data comes from value, not before value.",
        next_best_action=next_best_action,
        layers=[layer_0, layer_1, layer_2, layer_3],
        goals=goals,
        unlockable_agents=unlockable_agents,
        xp=gamification["xp"],
        streak=gamification["streak"],
        days_observed=days_observed,
    )
