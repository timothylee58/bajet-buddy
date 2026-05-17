from __future__ import annotations

from pydantic import BaseModel


class ReceiptScanResponse(BaseModel):
    store_name: str
    item: str
    amount: float
    category: str
    category_id: str
    currency: str = "MYR"
    under_category_average: bool
    category_average: float
    xp_awarded: int
    badge: str | None
    gamification_status: dict
