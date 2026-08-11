from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.schemas.persona import (
    PersonaAnalyzeRequest,
    PersonaAnalyzeResponse,
    PersonaRerollResponse,
)
from app.services.persona_analyzer import analyze_persona
from app.services.persona_service import get_persona_for_user, reroll_persona_for_user

router = APIRouter()

# Mock user state
MOCK_XP = 420
MOCK_STREAK = 7
MOCK_TRANSACTIONS = [
    {"category": "shopping", "merchant": "Shopee Malaysia", "amount": 189.0, "created_at": datetime.now(timezone.utc) - timedelta(hours=1), "bnpl": True},
    {"category": "shopping", "merchant": "TikTok Shop", "amount": 74.0, "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=2), "bnpl": False},
    {"category": "food", "merchant": "FamilyMart", "amount": 18.5, "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=12), "bnpl": False},
    {"category": "food", "merchant": "GrabFood", "amount": 29.0, "created_at": datetime.now(timezone.utc) - timedelta(days=2, hours=10), "bnpl": False},
]


@router.get("")
async def get_persona(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    if not current_user:
        response = analyze_persona(
            transactions=MOCK_TRANSACTIONS,
            monthly_income=3200,
            current_balance=340,
            bnpl_commitments=2,
            days_until_salary=7,
            xp=MOCK_XP,
            streak=MOCK_STREAK,
        )
        return response["persona"]

    persona, meta = await get_persona_for_user(current_user.user_id)
    payload = persona.model_dump()
    payload.update(meta)
    return payload


@router.post("/analyze", response_model=PersonaAnalyzeResponse)
async def analyze_persona_route(
    payload: PersonaAnalyzeRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
):
    return analyze_persona(
        transactions=[item.model_dump() for item in payload.transactions],
        monthly_income=payload.monthly_income,
        current_balance=payload.current_balance,
        bnpl_commitments=payload.bnpl_commitments,
        days_until_salary=payload.days_until_salary,
    )


@router.post("/reroll", response_model=PersonaRerollResponse)
async def reroll_persona(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    if not current_user:
        return PersonaRerollResponse(
            status="error",
            error="Persona reroll requires an authenticated user",
        )

    status, persona, meta = await reroll_persona_for_user(current_user.user_id)
    return PersonaRerollResponse(
        status=status,
        persona=persona,
        last_reroll_at=meta.get("last_reroll_at"),
        next_reroll_at=meta.get("next_reroll_at"),
        cooldown_days=meta.get("cooldown_days"),
    )
