from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Literal


class FOMONegotiateRequest(BaseModel):
    amount: float = Field(..., gt=0)
    item_name: str
    merchant: str
    category: str
    current_balance: float = Field(default=340.0)
    days_until_salary: int = Field(default=7)
    bnpl_load: float = Field(default=214.0, description="Total BNPL due this month")


class FOMOOption(BaseModel):
    label: str
    icon: str
    impact_summary: str
    warning: str
    xp_delta: int
    recommended: bool


class FOMONegotiateResponse(BaseModel):
    fomo_validation: str
    trap_exposure: str
    option_cash: FOMOOption
    option_bnpl: FOMOOption
    option_walk_away: FOMOOption
    overspent_cards_used: int = Field(..., ge=0, le=3)
    tax_mode_active: bool
    tax_rate_pct: float


class FOMOResolveRequest(BaseModel):
    choice: Literal["cash", "bnpl", "walk_away"]
    amount: float = Field(..., gt=0)
    category: str


class FOMOResolveResponse(BaseModel):
    overspent_cards_used: int
    tax_mode_active: bool
    tax_mode_triggered_now: bool
    xp_delta: int
    message: str
    cooldown_until: str | None = None
    tax_amount: float | None = None
