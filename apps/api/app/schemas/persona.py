from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PersonaType = Literal[
    "midnight_shopee_queen",
    "gaji_habis_king",
    "bubble_tea_bro",
    "mamak_lepak_spender",
    "bnpl_roller",
    "grabfood_spiral",
    "bonus_burner",
    "future_homeowner",
    "savings_starter",
]


class PersonaOut(BaseModel):
    type: PersonaType
    name: str
    emoji: str
    description: str
    level: int
    xp: int
    xp_to_next: int
    streak: int
    explanation: str
    suggested_intervention_rule: str
    confidence: int = Field(..., ge=0, le=100)
    top_signals: list[str] = Field(default_factory=list)


class PersonaTransactionSignal(BaseModel):
    category: str
    merchant: str
    amount: float = Field(..., ge=0)
    created_at: datetime
    bnpl: bool = False


class PersonaAnalyzeRequest(BaseModel):
    transactions: list[PersonaTransactionSignal]
    monthly_income: float = Field(..., gt=0)
    current_balance: float = Field(..., ge=0)
    bnpl_commitments: int = Field(default=0, ge=0)
    days_until_salary: int = Field(default=0, ge=0)


class PersonaAnalyzeResponse(BaseModel):
    persona: PersonaOut


class PersonaRerollResponse(BaseModel):
    status: Literal["ok", "cooldown", "error"]
    persona: PersonaOut | None = None
    last_reroll_at: datetime | None = None
    next_reroll_at: datetime | None = None
    cooldown_days: int | None = None
    error: str | None = None
