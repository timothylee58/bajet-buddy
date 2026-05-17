from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.onboarding import OnboardingAnswers, OnboardingRoast
from app.services.onboarding_roast_service import generate_roast

router = APIRouter()


@router.post("/roast", response_model=OnboardingRoast)
async def roast_onboarding(
    payload: OnboardingAnswers,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> OnboardingRoast:
    return await generate_roast(payload)
