from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


LayerStatus = Literal["available", "active", "locked", "complete"]
GoalType = Literal["emergency_fund", "debt_reduction", "home_savings", "no_spend"]
AgentStatus = Literal["locked", "ready", "unlocked"]


class ProfilingLayerOut(BaseModel):
    id: str
    title: str
    status: LayerStatus
    description: str
    value_unlocked: str
    signals: list[str] = Field(default_factory=list)
    cta: str


class GoalProfileOut(BaseModel):
    type: GoalType
    label: str
    commitment_label: str
    started: bool
    progress_label: str


class UnlockableAgentOut(BaseModel):
    code: str
    label: str
    status: AgentStatus
    description: str
    unlock_rule: str
    progress_label: str


class ProgressiveProfilingSummaryOut(BaseModel):
    profile_score: int = Field(..., ge=0, le=100)
    principle: str
    next_best_action: str
    layers: list[ProfilingLayerOut]
    goals: list[GoalProfileOut]
    unlockable_agents: list[UnlockableAgentOut]
    xp: int = Field(..., ge=0)
    streak: int = Field(..., ge=0)
    days_observed: int = Field(..., ge=0)


class ActivateGoalRequest(BaseModel):
    type: GoalType
    commitment_amount: int = Field(..., ge=1)


class ActivateGoalResponse(BaseModel):
    summary: ProgressiveProfilingSummaryOut
