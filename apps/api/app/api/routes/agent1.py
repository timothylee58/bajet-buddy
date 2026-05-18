from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.agent1 import (
    Agent1ProfileRequest,
    Agent1ProfileResponse,
    OnboardingAnalysisResponse,
    OnboardingAnswersRequest,
)
from app.services.agent1_service import run_agent1_profile, analyze_onboarding_answers

router = APIRouter()


@router.post("/profile", response_model=Agent1ProfileResponse)
async def agent1_profile_endpoint(
    payload: Agent1ProfileRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> Agent1ProfileResponse:
    """Agent 1: Profile & Balance Agent — analyse spending habits from DB transactions."""
    user_id = current_user.user_id if current_user and current_user.user_id else payload.user_id
    return await run_agent1_profile(user_id=user_id)


@router.post("/onboard", response_model=OnboardingAnalysisResponse)
async def agent1_onboard_endpoint(
    payload: OnboardingAnswersRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> OnboardingAnalysisResponse:
    """Agent 1 onboarding: analyse 5 Q&A answers via DeepSeek to assign initial persona."""
    user_id = current_user.user_id if current_user and current_user.user_id else "00000000-0000-0000-0000-000000000001"
    answers = {
        "coffee_boba_weekly_estimate": payload.coffee_boba_weekly_estimate,
        "impulse_category_lean": payload.impulse_category_lean,
        "balance_check_behavior": payload.balance_check_behavior,
        "late_night_impulse_tolerance": payload.late_night_impulse_tolerance,
        "savings_disposition": payload.savings_disposition,
        "_txns": payload.transactions,  # pass through for analysis
    }
    result = await analyze_onboarding_answers(answers, user_id=user_id)
    return OnboardingAnalysisResponse(**result)
