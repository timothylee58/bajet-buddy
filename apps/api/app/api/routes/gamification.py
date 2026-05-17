from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_current_user
from app.services.gamification_service import get_gamification_status
from app.services.loot_box_service import pull_loot_box
from app.services.agent_roster_service import get_agent_roster

router = APIRouter()


@router.get("/status")
async def gamification_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    return get_gamification_status(current_user.user_id)


@router.post("/loot-box")
async def open_loot_box(current_user: AuthenticatedUser = Depends(get_current_user)):
    return pull_loot_box(current_user.user_id)


@router.get("/agents")
async def agent_roster(current_user: AuthenticatedUser = Depends(get_current_user)):
    status = get_gamification_status(current_user.user_id)
    return get_agent_roster(
        current_user.user_id,
        xp=status["xp"],
        streak=status["streak"],
    )
