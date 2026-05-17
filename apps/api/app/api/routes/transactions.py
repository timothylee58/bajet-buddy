from fastapi import APIRouter, Depends
from app.core.auth import AuthenticatedUser, get_optional_user
from app.services.budget_service import get_budget_summary, get_category_budgets

router = APIRouter()

# Mock transaction history
MOCK_TRANSACTIONS = [
    {"id": "t1", "user_id": "00000000-0000-0000-0000-000000000001", "amount": 189.0, "category": "shopping", "merchant": "Shopee", "note": "", "verdict": "jangan_dulu", "created_at": "2026-05-16T22:30:00Z"},
    {"id": "t2", "user_id": "00000000-0000-0000-0000-000000000001", "amount": 12.5, "category": "food", "merchant": "McDonald's", "note": "", "verdict": "boleh", "created_at": "2026-05-16T13:00:00Z"},
    {"id": "t3", "user_id": "00000000-0000-0000-0000-000000000001", "amount": 45.0, "category": "transport", "merchant": "Grab", "note": "", "verdict": "boleh", "created_at": "2026-05-15T09:00:00Z"},
]


@router.get("")
async def list_transactions(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return MOCK_TRANSACTIONS


@router.get("/summary")
async def budget_summary(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return get_budget_summary(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")


@router.get("/categories")
async def category_budgets(current_user: AuthenticatedUser | None = Depends(get_optional_user)):
    return get_category_budgets(current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001")
