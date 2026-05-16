from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_current_user

from app.risk_engine import RiskEvaluationInput, evaluate_risk
from app.schemas.risk import AINudgeContext, RiskEvaluateRequest, RiskEvaluateResponse

router = APIRouter()


@router.post("/evaluate", response_model=RiskEvaluateResponse)
async def evaluate_purchase_risk(
    payload: RiskEvaluateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> RiskEvaluateResponse:
    result = evaluate_risk(
        RiskEvaluationInput(
            amount=payload.amount,
            category=payload.category,
            merchant=payload.merchant,
            merchant_type=payload.merchant_type,
            purchase_at=payload.purchase_at,
            current_balance=payload.current_balance,
            days_until_salary=payload.days_until_salary,
            current_daily_survival_amount=payload.current_daily_survival_amount,
            category_budget_allocated=payload.category_budget_allocated,
            category_budget_spent=payload.category_budget_spent,
            bnpl_due_this_month=payload.bnpl_due_this_month,
            bnpl_due_within_7_days=payload.bnpl_due_within_7_days,
            has_midnight_spending_pattern=payload.has_midnight_spending_pattern,
            historical_behaviour_score=payload.historical_behaviour_score,
        )
    )

    return RiskEvaluateResponse(
        risk_score=result.risk_score,
        verdict=result.verdict,
        reason_codes=result.reason_codes,
        recommended_action=result.recommended_action,
        projected_remaining_balance=result.projected_remaining_balance,
        projected_daily_survival_amount=result.projected_daily_survival_amount,
        factor_breakdown=[
            {
                "factor": factor.factor,
                "score": factor.score,
                "signal": factor.signal,
            }
            for factor in result.factor_breakdown
        ],
        ai_nudge_context=AINudgeContext(
            verdict=result.verdict,
            risk_score=result.risk_score,
            reason_codes=result.reason_codes,
            recommended_action=result.recommended_action,
            purchase_amount=payload.amount,
            merchant=payload.merchant,
            category=payload.category,
            merchant_type=payload.merchant_type,
            current_balance=payload.current_balance,
            projected_remaining_balance=result.projected_remaining_balance,
            current_daily_survival_amount=payload.current_daily_survival_amount,
            projected_daily_survival_amount=result.projected_daily_survival_amount,
            days_until_salary=payload.days_until_salary,
            bnpl_due_within_7_days=payload.bnpl_due_within_7_days,
            has_midnight_spending_pattern=payload.has_midnight_spending_pattern,
        ),
    )
