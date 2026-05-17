from __future__ import annotations

from fastapi import APIRouter

from app.schemas.fomo import (
    FOMONegotiateRequest,
    FOMONegotiateResponse,
    FOMOResolveRequest,
    FOMOResolveResponse,
)
from app.services import fomo_service

router = APIRouter()

_DEMO_USER = "demo-user"


@router.post("/negotiate", response_model=FOMONegotiateResponse)
async def negotiate(payload: FOMONegotiateRequest) -> FOMONegotiateResponse:
    return await fomo_service.negotiate(payload, user_id=_DEMO_USER)


@router.post("/resolve", response_model=FOMOResolveResponse)
async def resolve(payload: FOMOResolveRequest) -> FOMOResolveResponse:
    return await fomo_service.resolve(payload, user_id=_DEMO_USER)


@router.get("/state")
async def state() -> dict:
    return await fomo_service.get_fomo_state(user_id=_DEMO_USER)
