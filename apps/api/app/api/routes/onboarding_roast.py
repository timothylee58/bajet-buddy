from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.onboarding import OnboardingAnswers, OnboardingRoast
from app.services.onboarding_roast_service import generate_roast

router = APIRouter()


@router.post("/roast", response_model=OnboardingRoast)
async def roast_onboarding(
    payload: OnboardingAnswers,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> OnboardingRoast:
    """Onboarding roast — works for both authenticated and guest users."""
    return await generate_roast(payload)
