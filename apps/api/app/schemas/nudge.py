from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Verdict = Literal["BOLEH", "FIKIR_DULU", "JANGAN_DULU"]
ToneMode = Literal["professional", "friendly", "manglish", "strict", "encouraging"]
LanguagePreference = Literal["bm", "en", "manglish"]


class UserProfileInput(BaseModel):
    name: str
    age: int | None = Field(default=None, ge=0)
    occupation: str | None = None
    monthly_income: float | None = Field(default=None, ge=0)


class TransactionIntentInput(BaseModel):
    amount: float = Field(..., gt=0)
    merchant: str
    category: str
    merchant_type: str = "discretionary"
    item_name: str | None = None
    essential: bool = False


class BudgetContextInput(BaseModel):
    current_balance: float = Field(..., ge=0)
    days_until_salary: int = Field(..., ge=0)
    current_daily_survival_amount: float = Field(..., ge=0)
    projected_remaining_balance: float
    projected_daily_survival_amount: float
    category_budget_usage_pct: float = Field(..., ge=0)
    total_monthly_spending: float | None = Field(default=None, ge=0)


class BNPLContextInput(BaseModel):
    due_this_month: float = Field(default=0, ge=0)
    due_within_7_days: float = Field(default=0, ge=0)
    active_commitments: int = Field(default=0, ge=0)


class UserPersonaInput(BaseModel):
    code: str
    label: str
    description: str | None = None


class NudgeGenerateRequest(BaseModel):
    user_profile: UserProfileInput
    transaction_intent: TransactionIntentInput
    risk_score: int = Field(..., ge=0, le=100)
    budget_context: BudgetContextInput
    bnpl_context: BNPLContextInput
    user_persona: UserPersonaInput
    language_preference: LanguagePreference = "en"
    tone_mode: ToneMode = "friendly"
    reason_codes: list[str] = Field(default_factory=list)


class NudgeGenerateResponse(BaseModel):
    verdict: Verdict
    short_nudge: str
    explanation: str
    tradeoff: str
    alternative_action: str
    cta_buttons: list[str]
    language: LanguagePreference
    tone_mode: ToneMode
    provider: str
    examples: dict[str, str]
