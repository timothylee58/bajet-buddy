from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.services.agent_roster_service import get_agent_roster
from app.services.gamification_service import get_gamification_status
from app.services.loot_box_service import pull_loot_box

router = APIRouter()


@router.get("/status")
async def gamification_status(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return get_gamification_status(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.post("/loot-box")
async def open_loot_box(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return pull_loot_box(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.get("/agents")
async def agent_roster(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    status = get_gamification_status(user_id)
    return get_agent_roster(
        user_id,
        xp=status["xp"],
        streak=status["streak"],
    )
