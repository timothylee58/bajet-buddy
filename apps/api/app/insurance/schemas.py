from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

InsuranceProductType = Literal["bnpl_default_protection", "purchase_protection"]
PolicyStatus = Literal["active", "expired", "claimed", "cancelled"]


class InsuranceQuoteRequest(BaseModel):
    verdict: Literal["boleh", "fikir_dulu", "jangan_dulu"]
    amount: float = Field(..., gt=0)
    category: str = "other"


class InsuranceQuoteResponse(BaseModel):
    product_type: InsuranceProductType
    partner_name: str = "Etiqa (mock)"
    premium: float
    coverage_amount: float
    pitch: str


class InsurancePurchaseRequest(BaseModel):
    product_type: InsuranceProductType
    premium: float = Field(..., gt=0)
    coverage_amount: float = Field(..., gt=0)
    linked_transaction_id: str | None = None


class InsurancePolicyOut(BaseModel):
    id: str
    product_type: InsuranceProductType
    partner_name: str
    premium: float
    coverage_amount: float
    status: PolicyStatus
    starts_at: datetime
    ends_at: datetime
