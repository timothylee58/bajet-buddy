import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import AuthenticatedUser, get_optional_user
from app.core.database import get_supabase
from app.services.budget_service import get_budget_summary, get_category_budgets
from app.services.transaction_service import get_user_transactions

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateTransactionRequest(BaseModel):
    merchant: str
    amount: float
    category: str = "other"
    note: str = ""
    verdict: str = "boleh"


@router.get("")
async def list_transactions(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    return await get_user_transactions(user_id)


@router.get("/summary")
async def budget_summary(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    return await get_budget_summary(user_id)


@router.get("/categories")
async def category_budgets(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    return await get_category_budgets(user_id)


@router.post("")
async def create_transaction(
    payload: CreateTransactionRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
):
    """Add a single transaction manually."""
    user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
    db_amount = -abs(payload.amount)  # always negative for spending

    supabase = get_supabase()
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase not available")

    try:
        res = supabase.table("transactions").insert({
            "user_id": user_id,
            "amount": db_amount,
            "category": payload.category.lower(),
            "merchant": payload.merchant,
            "note": payload.note,
            "verdict": payload.verdict,
        }).execute()

        if hasattr(res, "data") and res.data and len(res.data) > 0:
            return {"status": "ok", "transaction": res.data[0]}
        raise HTTPException(status_code=500, detail="Insert returned no data")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create transaction")
        raise HTTPException(status_code=500, detail=str(e)[:200])
