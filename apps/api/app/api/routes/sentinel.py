from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.sentinel import (
    InflationQuest,
    SentinelDashboardResponse,
    SimulateEventRequest,
    SimulateEventResponse,
)
from app.services import sentinel_service

router = APIRouter()

_DEMO_USER = "00000000-0000-0000-0000-000000000001"


@router.get("/dashboard", response_model=SentinelDashboardResponse)
async def dashboard() -> SentinelDashboardResponse:
    return await sentinel_service.get_dashboard(_DEMO_USER)


@router.post("/simulate-event", response_model=SimulateEventResponse)
async def simulate_event(payload: SimulateEventRequest) -> SimulateEventResponse:
    return await sentinel_service.simulate_event(_DEMO_USER, payload.event_type)


@router.get("/quests", response_model=list[InflationQuest])
async def quests() -> list[InflationQuest]:
    return await sentinel_service.get_quests(_DEMO_USER)


@router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: str) -> dict:
    result = await sentinel_service.complete_quest(_DEMO_USER, quest_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.post("/scan")
async def scan_commodities() -> dict:
    """Agent 5: Scan user transactions → correlate with market news → predict price impact."""
    return await sentinel_service.scan_commodities(_DEMO_USER)
