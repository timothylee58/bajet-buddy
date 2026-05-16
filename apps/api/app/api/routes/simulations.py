from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.simulation import FutureYouRequest, FutureYouResponse
from app.services.simulation_service import simulate_future_you

router = APIRouter()


@router.post("/future-you", response_model=FutureYouResponse)
async def future_you(
    payload: FutureYouRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> FutureYouResponse:
    return simulate_future_you(payload)
