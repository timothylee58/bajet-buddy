from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_optional_user
from app.insurance.schemas import (
    InsurancePolicyOut,
    InsurancePurchaseRequest,
    InsuranceQuoteRequest,
    InsuranceQuoteResponse,
)
from app.insurance.services import get_contextual_offer, get_policies, purchase_policy

router = APIRouter()


def _resolve_user_id(current_user: AuthenticatedUser | None) -> str:
    return current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"


@router.post("/quote", response_model=InsuranceQuoteResponse | None)
async def insurance_quote(
    payload: InsuranceQuoteRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> InsuranceQuoteResponse | None:
    return await get_contextual_offer(_resolve_user_id(current_user), payload.verdict, payload.amount)


@router.post("/purchase", response_model=InsurancePolicyOut)
async def insurance_purchase(
    payload: InsurancePurchaseRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> InsurancePolicyOut:
    user_id = _resolve_user_id(current_user)
    return await purchase_policy(
        user_id,
        payload.product_type,
        payload.premium,
        payload.coverage_amount,
        payload.linked_transaction_id,
    )


@router.get("/policies", response_model=list[InsurancePolicyOut])
async def insurance_policies(
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> list[InsurancePolicyOut]:
    return await get_policies(_resolve_user_id(current_user))
