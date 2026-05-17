from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.agent1 import Agent1ProfileRequest, Agent1ProfileResponse
from app.services.agent1_service import run_agent1_profile

router = APIRouter()


@router.post("/profile", response_model=Agent1ProfileResponse)
async def agent1_profile_endpoint(
    payload: Agent1ProfileRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> Agent1ProfileResponse:
    """Agent 1: Profile & Balance Agent — analyse spending habits from DB transactions."""
    user_id = current_user.user_id if current_user and current_user.user_id else payload.user_id
    return await run_agent1_profile(user_id=user_id)
