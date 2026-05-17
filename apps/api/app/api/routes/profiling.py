from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.profiling import (
    ActivateGoalRequest,
    ActivateGoalResponse,
    ProgressiveProfilingSummaryOut,
)
from app.services.progressive_profiling_service import (
    activate_goal,
    build_progressive_profile_summary,
)

router = APIRouter()


@router.get("/summary", response_model=ProgressiveProfilingSummaryOut)
async def profiling_summary(
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> ProgressiveProfilingSummaryOut:
    return build_progressive_profile_summary(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.post("/goals/activate", response_model=ActivateGoalResponse)
async def activate_profiling_goal(
    payload: ActivateGoalRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> ActivateGoalResponse:
    activate_goal(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", payload.type, payload.commitment_amount)
    return ActivateGoalResponse(
        summary=build_progressive_profile_summary(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")
    )
