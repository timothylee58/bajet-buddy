from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Cadence = Literal["weekly", "fortnightly", "monthly", "quarterly", "yearly"]


class RecurringSubscription(BaseModel):
    merchant: str = Field(..., description="Display name of the merchant the charge recurs under")
    category: str = Field(..., description="Category taken from the most recent matching transaction")
    cadence: Cadence = Field(..., description="Detected billing rhythm")
    average_amount_rm: float = Field(..., description="Mean charge across the detected occurrences")
    monthly_cost_rm: float = Field(..., description="Average charge normalized to a monthly figure")
    annual_cost_rm: float = Field(..., description="Monthly cost projected over twelve months")
    occurrences: int = Field(..., description="Number of charges backing this detection")
    last_charged_at: str = Field(..., description="ISO date of the most recent charge")
    next_expected_at: str = Field(..., description="ISO date the next charge is projected for")
    confidence: int = Field(..., description="0-100 confidence that this is a true subscription")
    is_overdue: bool = Field(..., description="True when the projected charge date has already passed")


class RecurringSummary(BaseModel):
    subscriptions: list[RecurringSubscription] = Field(
        ..., description="Detected subscriptions, most expensive per year first"
    )
    total_monthly_rm: float = Field(..., description="Combined monthly cost of every detection")
    total_annual_rm: float = Field(..., description="Combined annual cost of every detection")
    pct_of_income: float | None = Field(
        None, description="Total monthly cost as a percentage of monthly income, null when income is unknown"
    )
    insight: str = Field(..., description="Short Manglish summary of the subscription load")
