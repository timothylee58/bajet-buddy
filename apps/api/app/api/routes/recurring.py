from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import DEMO_USER_ID, AuthenticatedUser, get_optional_user
from app.schemas.recurring import RecurringSummary
from app.services.recurring_service import get_recurring_summary

router = APIRouter()


@router.get("", response_model=RecurringSummary)
async def read_recurring(
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> RecurringSummary:
    user_id = current_user.user_id if current_user else DEMO_USER_ID
    return await get_recurring_summary(user_id)
