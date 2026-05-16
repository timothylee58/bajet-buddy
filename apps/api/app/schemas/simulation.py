from __future__ import annotations

from pydantic import BaseModel, Field


class FutureYouRequest(BaseModel):
    question: str
    purchase_amount: float = Field(..., gt=0)
    purchase_name: str
    monthly_income: float = Field(..., gt=0)
    current_balance: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)
    monthly_savings_contribution: float = Field(default=0, ge=0)
    emergency_fund: float = Field(default=0, ge=0)
    bnpl_monthly_payment: float = Field(default=0, ge=0)
    bnpl_months: int = Field(default=6, ge=1)


class FutureTimelinePoint(BaseModel):
    month: str
    cashflow_end_balance: float
    savings_balance: float
    emergency_fund_balance: float
    bnpl_remaining: float


class FutureScenario(BaseModel):
    id: str
    title: str
    description: str
    six_month_cashflow: list[FutureTimelinePoint]
    bnpl_burden: float
    emergency_fund_impact: float
    savings_impact: float
    stress_score: int = Field(..., ge=0, le=100)
    recommendation: str


class FutureYouResponse(BaseModel):
    verdict: str
    summary: str
    recommended_scenario_id: str
    scenarios: list[FutureScenario]
