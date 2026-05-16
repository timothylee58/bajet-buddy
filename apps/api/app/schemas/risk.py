from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Verdict = Literal["BOLEH", "FIKIR_DULU", "JANGAN_DULU"]
MerchantType = Literal["essential", "discretionary", "mixed"]


class RiskEvaluateRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Purchase amount in RM")
    category: str = Field(..., min_length=1, description="Category id")
    merchant: str = Field(..., min_length=1, description="Merchant name")
    merchant_type: MerchantType = Field(
        default="discretionary", description="Merchant classification"
    )
    purchase_at: datetime = Field(..., description="Purchase timestamp")
    current_balance: float = Field(..., ge=0, description="Current available balance")
    days_until_salary: int = Field(..., ge=0, description="Days left until salary")
    current_daily_survival_amount: float = Field(
        ..., ge=0, description="Current safe daily amount before this purchase"
    )
    category_budget_allocated: float = Field(
        ..., gt=0, description="Allocated budget for the category"
    )
    category_budget_spent: float = Field(
        ..., ge=0, description="Current spent amount in the category"
    )
    bnpl_due_this_month: float = Field(default=0, ge=0)
    bnpl_due_within_7_days: float = Field(default=0, ge=0)
    has_midnight_spending_pattern: bool = False
    historical_behaviour_score: int = Field(default=50, ge=0, le=100)


class RiskFactorBreakdown(BaseModel):
    factor: str
    score: int
    signal: str


class AINudgeContext(BaseModel):
    verdict: Verdict
    risk_score: int = Field(..., ge=0, le=100)
    reason_codes: list[str]
    recommended_action: str
    purchase_amount: float
    merchant: str
    category: str
    merchant_type: MerchantType
    current_balance: float
    projected_remaining_balance: float
    current_daily_survival_amount: float
    projected_daily_survival_amount: float
    days_until_salary: int
    bnpl_due_within_7_days: float
    has_midnight_spending_pattern: bool


class RiskEvaluateResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    verdict: Verdict
    reason_codes: list[str]
    recommended_action: str
    projected_remaining_balance: float
    projected_daily_survival_amount: float
    factor_breakdown: list[RiskFactorBreakdown]
    ai_nudge_context: AINudgeContext
