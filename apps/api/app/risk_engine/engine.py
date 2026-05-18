from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


Verdict = Literal["BOLEH", "FIKIR_DULU", "JANGAN_DULU"]
MerchantType = Literal["essential", "discretionary", "mixed"]


@dataclass(slots=True)
class RiskEvaluationInput:
    amount: float
    category: str
    merchant: str
    merchant_type: MerchantType
    purchase_at: datetime
    current_balance: float
    days_until_salary: int
    current_daily_survival_amount: float
    category_budget_allocated: float
    category_budget_spent: float
    bnpl_due_this_month: float = 0.0
    bnpl_due_within_7_days: float = 0.0
    uses_bnpl: bool = False
    has_midnight_spending_pattern: bool = False
    historical_behaviour_score: int = 50


@dataclass(slots=True)
class RiskFactorDetail:
    factor: str
    score: int
    signal: str


@dataclass(slots=True)
class RiskEvaluationResult:
    risk_score: int
    verdict: Verdict
    reason_codes: list[str]
    recommended_action: str
    projected_remaining_balance: float
    projected_daily_survival_amount: float
    factor_breakdown: list[RiskFactorDetail]


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def _purchase_hour(purchase_at: datetime) -> int:
    return purchase_at.hour


def _is_midnight_purchase(purchase_at: datetime) -> bool:
    hour = _purchase_hour(purchase_at)
    return hour >= 22 or hour < 2


def _round_money(amount: float) -> float:
    return round(amount, 2)


def _recommended_action(verdict: Verdict) -> str:
    if verdict == "JANGAN_DULU":
        return "Block the purchase, wait for salary, and review non-essential spending."
    if verdict == "FIKIR_DULU":
        return "Delay the purchase for 24 hours and review category budget plus BNPL dues."
    return "Purchase can proceed, but keep the daily runway above the safe threshold."


def evaluate_risk(payload: RiskEvaluationInput) -> RiskEvaluationResult:
    projected_remaining_balance = _round_money(payload.current_balance - payload.amount)
    salary_divisor = max(payload.days_until_salary, 1)
    projected_daily_survival_amount = _round_money(
        projected_remaining_balance / salary_divisor
    )

    category_usage_before = (
        payload.category_budget_spent / payload.category_budget_allocated
        if payload.category_budget_allocated > 0
        else 0
    )
    category_usage_after = (
        (payload.category_budget_spent + payload.amount) / payload.category_budget_allocated
        if payload.category_budget_allocated > 0
        else 1
    )
    purchase_vs_balance_ratio = payload.amount / max(payload.current_balance, 1)

    # Amount-tier scaling: small purchases shouldn't trigger the same alarms
    # < RM20  → micro (lenient: 0.2× risk weight)
    # < RM80  → small (moderate: 0.5×)
    # < RM200 → medium (standard: 0.8×)
    # ≥ RM200 → large  (full: 1.0×)
    if payload.amount < 20:
        amount_tier = 0.2
    elif payload.amount < 80:
        amount_tier = 0.5
    elif payload.amount < 200:
        amount_tier = 0.8
    else:
        amount_tier = 1.0

    factors: list[RiskFactorDetail] = []
    reason_codes: list[str] = []
    score = 0.0
    forced_verdict: Verdict | None = None

    category_score = int(_clamp(category_usage_after * 35, 0, 35) * amount_tier)
    factors.append(
        RiskFactorDetail(
            factor="category_budget_usage",
            score=category_score,
            signal=f"Projected category usage is {category_usage_after * 100:.0f}%.",
        )
    )
    score += category_score
    if category_usage_after >= 0.85:
        reason_codes.append("CATEGORY_BUDGET_ABOVE_85")

    days_score = int(_clamp((payload.days_until_salary / 30) * 12, 0, 12))
    factors.append(
        RiskFactorDetail(
            factor="days_until_salary",
            score=days_score,
            signal=f"{payload.days_until_salary} day(s) remain before salary.",
        )
    )
    score += days_score
    if payload.days_until_salary >= 10:
        reason_codes.append("LONG_TIME_TO_SALARY")

    if projected_daily_survival_amount < 25:
        daily_score = int(30 * amount_tier)
        if amount_tier >= 0.8:  # Only force block for medium+ purchases
            forced_verdict = "JANGAN_DULU"
        reason_codes.append("DAILY_SURVIVAL_BELOW_RM25")
    elif projected_daily_survival_amount < 40:
        daily_score = int(18 * amount_tier)
        reason_codes.append("DAILY_SURVIVAL_TIGHT")
    else:
        daily_score = int(
            _clamp((60 - projected_daily_survival_amount) / 2, 0, 12) * amount_tier
        )
    factors.append(
        RiskFactorDetail(
            factor="remaining_daily_amount",
            score=daily_score,
            signal=(
                f"Projected daily runway becomes RM{projected_daily_survival_amount:.2f}."
            ),
        )
    )
    score += daily_score

    if payload.bnpl_due_within_7_days > 0:
        bnpl_score = int(
            _clamp((payload.bnpl_due_within_7_days / max(payload.current_balance, 1)) * 25, 8, 25) * amount_tier
        )
        reason_codes.append("BNPL_DUE_WITHIN_7_DAYS")
        if payload.merchant_type == "discretionary" and amount_tier >= 0.8:
            forced_verdict = "JANGAN_DULU"
            reason_codes.append("BNPL_DUE_SOON_DISCRETIONARY")
    else:
        bnpl_score = int(
            _clamp((payload.bnpl_due_this_month / max(payload.current_balance, 1)) * 10, 0, 10) * amount_tier
        )
        if payload.bnpl_due_this_month > 0:
            reason_codes.append("BNPL_DUE_THIS_MONTH")
    factors.append(
        RiskFactorDetail(
            factor="bnpl_obligations",
            score=bnpl_score,
            signal=f"BNPL due within 7 days totals RM{payload.bnpl_due_within_7_days:.2f}.",
        )
    )
    score += bnpl_score

    # New risk factor: user intends to use BNPL for THIS purchase
    if payload.uses_bnpl:
        bnpl_choice_score = int(20 * amount_tier)
        reason_codes.append("USING_BNPL_FOR_PURCHASE")
        if payload.merchant_type == "discretionary" and payload.amount >= 200:
            bnpl_choice_score += 15
            reason_codes.append("BNPL_LARGE_DISCRETIONARY")
            if projected_daily_survival_amount < 40:
                forced_verdict = "JANGAN_DULU"
                reason_codes.append("BNPL_DANGER_ZONE")
        elif payload.amount >= 500:
            bnpl_choice_score += 10
            reason_codes.append("BNPL_HIGH_AMOUNT")
        factors.append(
            RiskFactorDetail(
                factor="uses_bnpl_this_purchase",
                score=bnpl_choice_score,
                signal=f"User intends to use BNPL for this RM{payload.amount:.2f} purchase — future debt risk.",
            )
        )
        score += bnpl_choice_score

    midnight_purchase = _is_midnight_purchase(payload.purchase_at)
    if midnight_purchase and payload.has_midnight_spending_pattern:
        time_score = int((18 if projected_daily_survival_amount < 40 else 12) * amount_tier)
        reason_codes.append("MIDNIGHT_SPENDING_PATTERN")
        if projected_daily_survival_amount < 40 and amount_tier >= 0.8:
            forced_verdict = "JANGAN_DULU"
    elif midnight_purchase:
        time_score = int(6 * amount_tier)
        reason_codes.append("LATE_NIGHT_PURCHASE")
    else:
        time_score = 1
    factors.append(
        RiskFactorDetail(
            factor="time_of_purchase",
            score=time_score,
            signal=f"Purchase hour is {payload.purchase_at.strftime('%H:%M')}.",
        )
    )
    score += time_score

    if payload.merchant_type == "essential":
        merchant_score = -10
        reason_codes.append("ESSENTIAL_PURCHASE_BUFFER")
    elif payload.merchant_type == "discretionary":
        merchant_score = int(10 * amount_tier)
        reason_codes.append("DISCRETIONARY_PURCHASE")
    else:
        merchant_score = int(4 * amount_tier)
    factors.append(
        RiskFactorDetail(
            factor="merchant_type",
            score=merchant_score,
            signal=f"Merchant type is {payload.merchant_type}.",
        )
    )
    score += merchant_score

    historical_score = int(_clamp(payload.historical_behaviour_score * 0.12, 0, 12))
    if payload.historical_behaviour_score >= 70:
        reason_codes.append("HISTORICAL_BEHAVIOUR_RISK")
    factors.append(
        RiskFactorDetail(
            factor="historical_behaviour",
            score=historical_score,
            signal=f"Historical behaviour score is {payload.historical_behaviour_score}.",
        )
    )
    score += historical_score

    if payload.days_until_salary <= 2:
        payday_score = -6
        reason_codes.append("PAYDAY_NEAR")
    elif payload.days_until_salary <= 5:
        payday_score = -2
    else:
        payday_score = int(6 * amount_tier)
    factors.append(
        RiskFactorDetail(
            factor="payday_proximity",
            score=payday_score,
            signal=f"Salary arrives in {payload.days_until_salary} day(s).",
        )
    )
    score += payday_score

    end_of_month_score = 0
    if payload.days_until_salary <= 7 and projected_remaining_balance < 300:
        end_of_month_score = int(14 * amount_tier)
        reason_codes.append("END_OF_MONTH_PRESSURE")
    elif payload.days_until_salary <= 10 and projected_remaining_balance < 500:
        end_of_month_score = int(8 * amount_tier)
    factors.append(
        RiskFactorDetail(
            factor="end_of_month_pressure",
            score=end_of_month_score,
            signal=f"Projected remaining balance is RM{projected_remaining_balance:.2f}.",
        )
    )
    score += end_of_month_score

    amount_score = int(_clamp(purchase_vs_balance_ratio * 25, 0, 25))
    if purchase_vs_balance_ratio >= 0.4:
        reason_codes.append("PURCHASE_LARGE_VS_BALANCE")
    factors.append(
        RiskFactorDetail(
            factor="purchase_amount_relative_to_balance",
            score=amount_score,
            signal=f"Purchase is {purchase_vs_balance_ratio * 100:.0f}% of current balance.",
        )
    )
    score += amount_score

    final_score = int(_clamp(round(score), 0, 100))

    # Marginal category bump: a micro purchase pushing category from 84%→85% shouldn't force FIKIR_DULU
    category_marginal_increase = category_usage_after - category_usage_before
    category_overspent_forcing = (
        category_usage_after >= 0.85 and category_marginal_increase > 0.03
    )

    if forced_verdict is not None:
        verdict = forced_verdict
    elif final_score >= 70:
        verdict = "JANGAN_DULU"
    elif final_score >= 45 or category_overspent_forcing:
        verdict = "FIKIR_DULU"
    else:
        verdict = "BOLEH"

    if verdict == "FIKIR_DULU" and "CATEGORY_BUDGET_ABOVE_85" not in reason_codes and category_usage_before >= 0.85:
        reason_codes.append("CATEGORY_BUDGET_ABOVE_85")

    deduped_reason_codes = list(dict.fromkeys(reason_codes))

    return RiskEvaluationResult(
        risk_score=final_score,
        verdict=verdict,
        reason_codes=deduped_reason_codes,
        recommended_action=_recommended_action(verdict),
        projected_remaining_balance=projected_remaining_balance,
        projected_daily_survival_amount=projected_daily_survival_amount,
        factor_breakdown=factors,
    )
