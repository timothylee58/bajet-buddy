from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_current_user
from app.services.gamification_service import get_gamification_status

router = APIRouter()

@router.get("/status")
async def gamification_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    return get_gamification_status(current_user.user_id)
