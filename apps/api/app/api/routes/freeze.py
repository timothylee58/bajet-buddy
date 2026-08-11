from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.freeze import FreezeActivateRequest, FreezeStatusOut
from app.services.freeze_service import (
    activate_freeze,
    get_freeze_status,
    override_freeze,
)

router = APIRouter()


@router.get("/status", response_model=FreezeStatusOut)
async def freeze_status(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return get_freeze_status(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.post("/activate", response_model=FreezeStatusOut)
async def freeze_activate(
    payload: FreezeActivateRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
):
    return activate_freeze(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001", payload.type)


@router.post("/override", response_model=FreezeStatusOut)
async def freeze_override(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    try:
        return override_freeze(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
