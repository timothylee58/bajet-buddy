from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.cikgu_profil import (
    CikguProfilRequest,
    CikguProfilResponse,
    OnboardingAnalysisResponse,
    OnboardingAnswersRequest,
)
from app.services.cikgu_profil_service import (
    analyze_onboarding_answers,
    run_cikgu_profil,
)

router = APIRouter()


@router.post("/profile", response_model=CikguProfilResponse)
async def cikgu_profil_endpoint(
    payload: CikguProfilRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> CikguProfilResponse:
    """Cikgu Profil: Profile & Balance Agent — analyse spending habits from DB transactions."""
    user_id = current_user.user_id if current_user and current_user.user_id else payload.user_id
    return await run_cikgu_profil(user_id=user_id)


@router.post("/onboard", response_model=OnboardingAnalysisResponse)
async def cikgu_profil_onboard_endpoint(
    payload: OnboardingAnswersRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> OnboardingAnalysisResponse:
    """Cikgu Profil onboarding: analyse 5 Q&A answers via DeepSeek to assign initial persona."""
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
