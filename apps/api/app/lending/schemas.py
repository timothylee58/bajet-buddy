from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ScoreBand = Literal["Poor", "Fair", "Good", "Very Good", "Excellent"]


class ScoreFactor(BaseModel):
    name: str
    value: float = Field(..., description="Raw 0-1 factor value")
    weight: float
    contribution: float = Field(..., description="value x weight, in raw-score units")


class CreditScoreResponse(BaseModel):
    score: int | None = Field(None, ge=300, le=850)
    band: ScoreBand | None = None
    insufficient_history: bool = False
    factors: list[ScoreFactor] = Field(default_factory=list)
    computed_at: datetime
    model_version: str = "v1"


# ─── P12: Lending referral marketplace ─────────────────────────────────────

ProductType = Literal["salary_advance", "bnpl_consolidation", "micro_personal"]
OfferStatus = Literal["offered", "expired", "applied", "withdrawn"]
ApplicationStatus = Literal["submitted", "approved", "rejected", "disbursed", "closed"]
RepaymentStatus = Literal["upcoming", "paid", "missed"]


class LoanOfferOut(BaseModel):
    id: str
    partner_name: str = "CIMB Octo (mock)"
    product_type: ProductType
    amount: float
    apr: float
    tenure_months: int
    total_repayable: float = Field(..., description="amount x (1 + apr/100 x tenure/12), for upfront disclosure")
    min_score_required: int
    status: OfferStatus = "offered"
    reason: str = Field(..., description="Plain-language explainability: why this offer, which factor drove it")
    expires_at: datetime


class RepaymentOut(BaseModel):
    id: str
    due_date: str
    amount: float
    status: RepaymentStatus = "upcoming"


class LoanApplicationOut(BaseModel):
    id: str
    offer_id: str
    status: ApplicationStatus = "submitted"
    partner_reference: str
    submitted_at: datetime
    decision_at: datetime | None = None
    repayments: list[RepaymentOut] = Field(default_factory=list)


class ApplyRequest(BaseModel):
    offer_id: str
