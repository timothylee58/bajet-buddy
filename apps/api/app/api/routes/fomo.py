from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.schemas.fomo import (
    FOMONegotiateRequest,
    FOMONegotiateResponse,
    FOMOResolveRequest,
    FOMOResolveResponse,
    FOMOStateResponse,
    PatternScanRequest,
    PatternScanResponse,
    PersonaRecommendRequest,
    PersonaRecommendResponse,
)
from app.services import fomo_service
from app.services.fomo_actions import (
    clear_lockdown,
    get_bnpl_monitor_state,
    get_fomo_journal,
    get_user_journal,
    report_app_opened,
)
from app.services.pattern_detection_service import TransactionSummary, detect_patterns

router = APIRouter()

_DEMO_USER = "demo-user"


@router.post("/negotiate", response_model=FOMONegotiateResponse)
async def negotiate(payload: FOMONegotiateRequest) -> FOMONegotiateResponse:
    return await fomo_service.negotiate(payload, user_id=_DEMO_USER)


@router.post("/resolve", response_model=FOMOResolveResponse)
async def resolve(payload: FOMOResolveRequest) -> FOMOResolveResponse:
    return await fomo_service.resolve(payload, user_id=_DEMO_USER)


@router.get("/state", response_model=FOMOStateResponse)
async def state() -> FOMOStateResponse:
    return await fomo_service.get_fomo_state(user_id=_DEMO_USER)


# ─── PWA Monitor ──────────────────────────────────────────────────────────────

class PwaMonitorStateOut(BaseModel):
    active: bool
    amount_rm: float
    category: str
    lockdown_triggered: bool
    lockdown_message: str


@router.get("/pwa-monitor", response_model=PwaMonitorStateOut)
async def pwa_monitor_state(user_id: str = Query(default=_DEMO_USER)) -> PwaMonitorStateOut:
    """Check if a BNPL monitor session is active for this user."""
    return get_bnpl_monitor_state(user_id)


class PwaReportRequest(BaseModel):
    user_id: str = _DEMO_USER
    domain: str


class PwaReportResponse(BaseModel):
    lockdown: bool
    message: str
    locked_until: str | None = None


@router.post("/pwa-monitor/report", response_model=PwaReportResponse)
async def pwa_report_app_opened(payload: PwaReportRequest) -> PwaReportResponse:
    """Called by the PWA frontend when the user opens another app/site."""
    return report_app_opened(payload.user_id, payload.domain)


@router.post("/pwa-monitor/clear")
async def pwa_clear_lockdown(user_id: str = Query(default=_DEMO_USER)) -> dict:
    """Clear the lockdown after the user acknowledges it."""
    return clear_lockdown(user_id)


# ─── Cross-agent data endpoints ────────────────────────────────────────────────

@router.get("/journal")
async def fomo_journal(user_id: str = Query(default=_DEMO_USER)) -> list[dict]:
    """Return FOMO decision history (for persona/sentinel analysis)."""
    return get_user_journal(user_id) if user_id != "all" else get_fomo_journal()


# ─── Pattern Scan ──────────────────────────────────────────────────────────────

@router.post("/scan-patterns", response_model=PatternScanResponse)
async def scan_patterns(payload: PatternScanRequest) -> PatternScanResponse:
    transactions: list[TransactionSummary] = [
        TransactionSummary(
            category=t.get("category", ""),
            amount=float(t.get("amount", 0)),
            hour_of_day=int(t.get("hour_of_day", 12)),
            day_of_month=int(t.get("day_of_month", 1)),
            used_bnpl=bool(t.get("used_bnpl", False)),
        )
        for t in payload.transactions
    ]
    result = await detect_patterns(_DEMO_USER, transactions)
    return PatternScanResponse(
        primary_pattern=result.primary_pattern,
        patterns=list(result.patterns),
        risk_insight=result.risk_insight,
        recommended_alert=result.recommended_alert,
    )


@router.post("/recommend-persona", response_model=PersonaRecommendResponse)
async def recommend_persona_route(payload: PersonaRecommendRequest) -> PersonaRecommendResponse:
    data = await fomo_service.recommend_persona(
        _DEMO_USER, payload.recent_choices, payload.spending_summary
    )
    return PersonaRecommendResponse(
        recommended_persona=data.get("recommended_persona", "pak_cik_audit"),
        reasoning=data.get("reasoning", ""),
    )
