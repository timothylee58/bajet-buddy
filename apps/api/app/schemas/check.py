from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class CheckRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Spend amount in RM")
    category: str = Field(..., description="Spend category id")
    merchant: str = Field(default="Unknown", description="Merchant name")
    merchant_type: Literal["essential", "discretionary", "mixed"] = "discretionary"
    item_name: str | None = None
    essential: bool = False
    language_preference: Literal["bm", "en", "manglish"] = "manglish"
    tone_mode: Literal["professional", "friendly", "manglish", "strict", "encouraging"] = "friendly"
    purchase_at: datetime | None = None


class PersonaSnapshot(BaseModel):
    type: str
    name: str
    emoji: str
    description: str
    confidence: int = Field(..., ge=0, le=100)


class FreezeSnapshot(BaseModel):
    active: bool
    type: Literal["soft", "hard"]
    reason: Literal["auto", "manual", "buddy"]
    message: str
    can_override: bool
    override_cost_xp: int
    activated_at: datetime | None = None


class CheckResponse(BaseModel):
    verdict: Literal["boleh", "fikir_dulu", "jangan_dulu"]
    nudge_bm: str
    nudge_en: str
    risk_score: int = Field(..., ge=0, le=100)
    budget_impact_pct: float
    xp_earned: int = 0
    reason_codes: list[str] = Field(default_factory=list)
    recommended_action: str = ""
    explanation: str = ""
    tradeoff: str = ""
    alternative_action: str = ""
    cta_buttons: list[str] = Field(default_factory=list)
    projected_remaining_balance: float | None = None
    projected_daily_survival_amount: float | None = None
    proactive_alert: bool = False
    proactive_trigger_reason: str | None = None
    persona: PersonaSnapshot | None = None
    freeze_status: FreezeSnapshot | None = None
    pipeline_trace: list[str] = Field(default_factory=list)
