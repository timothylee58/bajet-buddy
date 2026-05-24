from dataclasses import asdict

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.nudge_agent import NudgeRequestModel, generate_nudge_package
from app.nudge_agent.service import (
    BnplContextPayload,
    BudgetContextPayload,
    PersonaPayload,
    TransactionIntentPayload,
    UserProfilePayload,
)
from app.schemas.nudge import NudgeGenerateRequest, NudgeGenerateResponse

router = APIRouter()


@router.post("/generate", response_model=NudgeGenerateResponse)
async def generate_nudge(
    payload: NudgeGenerateRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> NudgeGenerateResponse:
    result = await generate_nudge_package(
        NudgeRequestModel(
            user_profile=UserProfilePayload(**payload.user_profile.model_dump()),
            transaction_intent=TransactionIntentPayload(
                **payload.transaction_intent.model_dump()
            ),
            risk_score=payload.risk_score,
            budget_context=BudgetContextPayload(**payload.budget_context.model_dump()),
            bnpl_context=BnplContextPayload(**payload.bnpl_context.model_dump()),
            user_persona=PersonaPayload(**payload.user_persona.model_dump()),
            language_preference=payload.language_preference,
            tone_mode=payload.tone_mode,
            reason_codes=payload.reason_codes,
        )
    )
    return NudgeGenerateResponse(**asdict(result))
