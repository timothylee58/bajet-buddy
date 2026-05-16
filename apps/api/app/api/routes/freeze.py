from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.freeze import FreezeActivateRequest, FreezeStatusOut
from app.services.freeze_service import get_freeze_status, activate_freeze, override_freeze

router = APIRouter()


@router.get("/status", response_model=FreezeStatusOut)
async def freeze_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    return get_freeze_status(current_user.user_id)


@router.post("/activate", response_model=FreezeStatusOut)
async def freeze_activate(
    payload: FreezeActivateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return activate_freeze(current_user.user_id, payload.type)


@router.post("/override", response_model=FreezeStatusOut)
async def freeze_override(current_user: AuthenticatedUser = Depends(get_current_user)):
    try:
        return override_freeze(current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
