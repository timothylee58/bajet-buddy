from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.check import (
    ChatCheckRequest,
    ChatCheckResponse,
    CheckRequest,
    CheckResponse,
)
from app.services.chat_check_service import run_chat_check
from app.services.check_agent_service import run_manual_prepurchase_check

router = APIRouter()


@router.post("", response_model=CheckResponse)
async def check_spend(
    payload: CheckRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> CheckResponse:
    """Manual pre-purchase check triggers the 5-node intervention agent."""
    return await run_manual_prepurchase_check(payload, user_id=current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.post("/chat", response_model=ChatCheckResponse)
async def chat_check_spend(
    payload: ChatCheckRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> ChatCheckResponse:
    """Natural-language pre-purchase check: chat message → AI parse → reasoning graph → conversational response."""
    return await run_chat_check(payload, user_id=current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")
