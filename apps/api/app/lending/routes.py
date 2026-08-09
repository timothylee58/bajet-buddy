from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import AuthenticatedUser, get_optional_user
from app.lending.schemas import (
    ApplyRequest,
    CreditScoreResponse,
    LoanApplicationOut,
    LoanOfferOut,
)
from app.lending.services import (
    apply_for_offer,
    get_application,
    get_offers_for_user,
    get_or_compute_credit_score,
)

router = APIRouter()


def _resolve_user_id(current_user: AuthenticatedUser | None) -> str:
    return current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"


@router.get("/score", response_model=CreditScoreResponse)
async def lending_score(
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> CreditScoreResponse:
    return await get_or_compute_credit_score(_resolve_user_id(current_user))


@router.get("/offers", response_model=list[LoanOfferOut])
async def lending_offers(
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> list[LoanOfferOut]:
    return await get_offers_for_user(_resolve_user_id(current_user))


@router.post("/apply", response_model=LoanApplicationOut)
async def lending_apply(
    payload: ApplyRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> LoanApplicationOut:
    user_id = _resolve_user_id(current_user)
    # Idempotency key: same user + same offer submitted twice returns the
    # same application rather than creating a duplicate at the partner,
    # matching the real-partner-API contract the spec calls for.
    idempotency_key = f"{user_id}:{payload.offer_id}"
    try:
        return await apply_for_offer(user_id, payload.offer_id, idempotency_key=idempotency_key)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/applications/{application_id}", response_model=LoanApplicationOut)
async def lending_application_status(
    application_id: str,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> LoanApplicationOut:
    application = await get_application(_resolve_user_id(current_user), application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application
