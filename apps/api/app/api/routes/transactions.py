from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_optional_user
from app.services.budget_service import get_budget_summary, get_category_budgets
from app.services.transaction_service import get_user_transactions

router = APIRouter()


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
