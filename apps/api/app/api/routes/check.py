from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.check import CheckRequest, CheckResponse
from app.services.check_agent_service import run_manual_prepurchase_check

router = APIRouter()


@router.post("", response_model=CheckResponse)
async def check_spend(
    payload: CheckRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CheckResponse:
    """Manual pre-purchase check triggers the 5-node intervention agent."""
    return await run_manual_prepurchase_check(payload, user_id=current_user.user_id)
