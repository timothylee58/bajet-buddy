from __future__ import annotations

from dataclasses import dataclass

from app.schemas.simulation import (
    FutureScenario,
    FutureTimelinePoint,
    FutureYouRequest,
    FutureYouResponse,
)


MONTH_LABELS = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"]


@dataclass(slots=True)
class ScenarioState:
    balance: float
    savings: float
    emergency_fund: float
    bnpl_remaining: float


def _round(amount: float) -> float:
    return round(amount, 2)


def _simulate_buy_now_bnpl(payload: FutureYouRequest) -> FutureScenario:
    monthly_bnpl = payload.purchase_amount / payload.bnpl_months
    state = ScenarioState(
        balance=payload.current_balance,
        savings=payload.monthly_savings_contribution * 2,
        emergency_fund=payload.emergency_fund,
        bnpl_remaining=payload.purchase_amount,
    )
    timeline: list[FutureTimelinePoint] = []
    for month in MONTH_LABELS:
        state.balance += payload.monthly_income - payload.monthly_expenses - monthly_bnpl
        state.savings += max(payload.monthly_savings_contribution * 0.25, 0)
        state.bnpl_remaining = max(0.0, state.bnpl_remaining - monthly_bnpl)
        timeline.append(
            FutureTimelinePoint(
                month=month,
                cashflow_end_balance=_round(state.balance),
                savings_balance=_round(state.savings),
                emergency_fund_balance=_round(state.emergency_fund),
                bnpl_remaining=_round(state.bnpl_remaining),
            )
        )
    stress_score = 78 if monthly_bnpl > 0.12 * payload.monthly_income else 66
    return FutureScenario(
        id="buy_now_bnpl",
        title="A. Buy now with BNPL",
        description="Take the iPhone now and spread the pain across six months.",
        six_month_cashflow=timeline,
        bnpl_burden=_round(monthly_bnpl),
        emergency_fund_impact=_round(payload.purchase_amount * 0.18),
        savings_impact=_round(payload.monthly_savings_contribution * 6 - timeline[-1].savings_balance),
        stress_score=stress_score,
        recommendation="High convenience, but it locks your next six months into a lifestyle payment.",
    )


def _simulate_save_first(payload: FutureYouRequest) -> FutureScenario:
    target_save = 500.0
    state = ScenarioState(
        balance=payload.current_balance,
        savings=payload.monthly_savings_contribution * 2,
        emergency_fund=payload.emergency_fund,
        bnpl_remaining=0.0,
    )
    timeline: list[FutureTimelinePoint] = []
    for index, month in enumerate(MONTH_LABELS, start=1):
        state.balance += payload.monthly_income - payload.monthly_expenses - target_save
        state.savings += target_save
        if index == 6:
            state.balance -= payload.purchase_amount
            state.savings = max(0.0, state.savings - payload.purchase_amount)
        timeline.append(
            FutureTimelinePoint(
                month=month,
                cashflow_end_balance=_round(state.balance),
                savings_balance=_round(state.savings),
                emergency_fund_balance=_round(state.emergency_fund),
                bnpl_remaining=0.0,
            )
        )
    return FutureScenario(
        id="save_first",
        title="B. Save RM500/month first",
        description="Delay the purchase and build the phone fund deliberately before buying.",
        six_month_cashflow=timeline,
        bnpl_burden=0.0,
        emergency_fund_impact=0.0,
        savings_impact=_round(payload.purchase_amount),
        stress_score=38,
        recommendation="Strong balance between desire and discipline. You keep control and avoid debt pressure.",
    )


def _simulate_skip_and_invest(payload: FutureYouRequest) -> FutureScenario:
    monthly_invest = max(500.0, payload.monthly_savings_contribution or 350.0)
    state = ScenarioState(
        balance=payload.current_balance,
        savings=payload.monthly_savings_contribution * 2,
        emergency_fund=payload.emergency_fund,
        bnpl_remaining=0.0,
    )
    timeline: list[FutureTimelinePoint] = []
    for month in MONTH_LABELS:
        state.balance += payload.monthly_income - payload.monthly_expenses - monthly_invest
        state.savings += monthly_invest
        state.emergency_fund += max(monthly_invest * 0.4, 200)
        timeline.append(
            FutureTimelinePoint(
                month=month,
                cashflow_end_balance=_round(state.balance),
                savings_balance=_round(state.savings),
                emergency_fund_balance=_round(state.emergency_fund),
                bnpl_remaining=0.0,
            )
        )
    return FutureScenario(
        id="skip_and_save",
        title="C. Skip purchase and invest/save instead",
        description="Keep the current phone longer and convert the urge into savings momentum.",
        six_month_cashflow=timeline,
        bnpl_burden=0.0,
        emergency_fund_impact=_round(-1 * (timeline[-1].emergency_fund_balance - payload.emergency_fund)),
        savings_impact=_round(timeline[-1].savings_balance - payload.monthly_savings_contribution * 2),
        stress_score=22,
        recommendation="Lowest stress and strongest future position, especially if your emergency fund is still thin.",
    )


def simulate_future_you(payload: FutureYouRequest) -> FutureYouResponse:
    scenarios = [
        _simulate_buy_now_bnpl(payload),
        _simulate_save_first(payload),
        _simulate_skip_and_invest(payload),
    ]
    ordered = sorted(scenarios, key=lambda scenario: scenario.stress_score)
    winner = ordered[0]
    verdict = (
        "Skip or delay the purchase. BNPL is the weakest future here."
        if winner.id != "buy_now_bnpl"
        else "Buying now is survivable, but it is still the riskiest cashflow path."
    )
    summary = (
        f"{winner.title} produces the lowest stress score and the healthiest 6-month runway. "
        f"{scenarios[0].title} creates the highest recurring burden."
    )
    return FutureYouResponse(
        verdict=verdict,
        summary=summary,
        recommended_scenario_id=winner.id,
        scenarios=scenarios,
    )
