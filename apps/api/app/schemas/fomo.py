from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Literal


PersonaCode = Literal["pak_cik_audit", "kak_therapist", "meme_goblin", "ice_cfo", "hype_man"]

EmotionalState = Literal["stressed", "bored", "happy", "yolo", "lapar"]


class FOMONegotiateRequest(BaseModel):
    amount: float = Field(..., gt=0)
    item_name: str
    merchant: str
    category: str
    current_balance: float = Field(default=340.0)
    days_until_salary: int = Field(default=7)
    bnpl_load: float = Field(default=214.0, description="Total BNPL due this month")
    emotional_state: EmotionalState = Field(default="happy")
    persona_preference: PersonaCode = Field(default="pak_cik_audit")


class FOMOPersona(BaseModel):
    code: PersonaCode
    name: str
    emoji: str
    tagline: str
    unlocked: bool
    unlock_condition: str


class FOMOOption(BaseModel):
    label: str
    icon: str
    impact_summary: str
    warning: str
    xp_delta: int
    bounty_rm: float
    recommended: bool


class FOMONegotiateResponse(BaseModel):
    persona: FOMOPersona
    fomo_validation: str
    trap_exposure: str
    persona_quip: str
    option_cash: FOMOOption
    option_bnpl: FOMOOption
    option_walk_away: FOMOOption
    heat_level: float = Field(..., ge=0, le=100)
    walk_away_streak: int
    bounty_jar_rm: float


class FOMOResolveRequest(BaseModel):
    choice: Literal["cash", "bnpl", "walk_away"]
    amount: float = Field(..., gt=0)
    category: str
    emotional_state: EmotionalState = Field(default="happy")


class FOMOResolveResponse(BaseModel):
    heat_level: float
    heat_delta: float
    walk_away_streak: int
    bounty_jar_rm: float
    bounty_earned_rm: float
    xp_delta: int
    loot_box_unlocked: bool
    message: str
    persona_reaction: str
    cooldown_until: str | None = None


class FOMOStateResponse(BaseModel):
    heat_level: float
    walk_away_streak: int
    bounty_jar_rm: float
    bounty_threshold_rm: float
    unlocked_personas: list[PersonaCode]
    cooldown_until: str | None = None
