from __future__ import annotations

from pydantic import BaseModel, Field


class Agent1ProfileRequest(BaseModel):
    """Request to run Agent 1 profiling for a user."""
    user_id: str = Field(default="demo")


class SpendingSignal(BaseModel):
    """A detected spending behaviour signal."""
    signal: str = Field(..., description="Human-readable signal description")
    severity: str = Field(default="medium", description="low, medium, or high")
    evidence: str = Field(default="", description="Supporting data point")


class OnboardingAnswersRequest(BaseModel):
    """5 Q&A answers from the onboarding flow."""
    coffee_boba_weekly_estimate: str = Field(default="")
    impulse_category_lean: str = Field(default="")
    balance_check_behavior: str = Field(default="")
    late_night_impulse_tolerance: str = Field(default="")
    savings_disposition: str = Field(default="")
    transactions: list[dict] = Field(default_factory=list, description="Optional — transactions from bank statement scan")


class OnboardingAnalysisResponse(BaseModel):
    """Agent 1 analysis of onboarding Q&A."""
    status: str = Field(default="ok")  # "ok" | "error"
    persona_code: str = Field(default="")
    persona_name: str = Field(default="")
    emoji: str = Field(default="")
    confidence: int = Field(default=0)
    explanation: str = Field(default="")
    roast: str = Field(default="", description="Playful roast based on answers")
    estimated_spending_profile: dict[str, float] = Field(default_factory=dict)
    top_signals: list[SpendingSignal] = Field(default_factory=list)
    processing_time_ms: float = Field(default=0.0)
    error: str | None = Field(default=None)
    raw_analysis: str = Field(default="")


class Agent1ProfileResponse(BaseModel):
    """Agent 1 profile analysis result."""
    status: str = Field(default="ok")  # "ok" | "insufficient_data" | "error"
    persona_code: str = Field(default="", description="Persona type code")
    persona_name: str = Field(default="", description="Localised persona name")
    emoji: str = Field(default="", description="Persona emoji")
    confidence: int = Field(default=0, description="0-100 confidence score")
    explanation: str = Field(default="", description="Why this persona was assigned")
    top_signals: list[SpendingSignal] = Field(default_factory=list)
    transaction_count: int = Field(default=0, description="How many transactions were analysed")
    min_required: int = Field(default=10, description="Minimum transactions needed for profiling")
    processing_time_ms: float = Field(default=0.0)
    error: str | None = Field(default=None)
    raw_analysis: str = Field(default="", description="Raw AI analysis output (debug)")
