from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.pet_companion import (
    AwardXPRequest,
    AwardXPResponse,
    PetNudge,
    PetNudgeRequest,
    PetProfile,
    PetSelectRequest,
    PetStatusResponse,
)
from app.services import pet_companion_service

router = APIRouter()


@router.get("/profile", response_model=PetProfile)
async def get_profile(current_user: AuthenticatedUser | None = Depends(get_optional_user)) -> PetProfile:
    data = pet_companion_service.get_or_create_profile(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")
    return pet_companion_service._store_to_profile(data)


@router.post("/select", response_model=PetProfile)
async def select_species(
    payload: PetSelectRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> PetProfile:
    return await pet_companion_service.select_species(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", payload.species)


@router.post("/award-xp", response_model=AwardXPResponse)
async def award_xp(
    payload: AwardXPRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> AwardXPResponse:
    return await pet_companion_service.award_xp(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", payload.event, payload.amount_rm)


@router.post("/nudge", response_model=PetNudge)
async def get_nudge(
    payload: PetNudgeRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> PetNudge:
    return await pet_companion_service.generate_nudge(
        current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", payload.context, payload.amount_rm, payload.category
    )


@router.get("/status", response_model=PetStatusResponse)
async def get_status(
    context: str = "dashboard_open",
    amount_rm: float | None = None,
    category: str | None = None,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> PetStatusResponse:
    return await pet_companion_service.get_status(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", context, amount_rm, category)
