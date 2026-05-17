from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

PetSpecies = Literal["raccoon", "fox", "squirrel", "rabbit", "finance_squirrel"]
PetMood = Literal["happy", "worried", "celebrating", "sleepy", "warning", "neutral"]
AccessorySlot = Literal["hat", "badge", "trail", "aura"]


class PetProfile(BaseModel):
    user_id: str
    species: PetSpecies
    name: str
    xp: int
    level: int
    mood: PetMood
    accessories: list[str]
    streak: int
    total_saves_rm: float
    walk_away_count: int


class PetAccessory(BaseModel):
    id: str
    name: str
    emoji: str
    slot: AccessorySlot
    unlock_xp: int
    description: str


class PetNudge(BaseModel):
    message: str
    mood: PetMood
    trigger: str
    xp_hint: int | None


class AwardXPRequest(BaseModel):
    event: str
    amount_rm: float | None = None


class AwardXPResponse(BaseModel):
    xp_earned: int
    total_xp: int
    level: int
    level_up: bool
    new_accessory: PetAccessory | None


class PetSelectRequest(BaseModel):
    species: PetSpecies


class PetNudgeRequest(BaseModel):
    context: str
    amount_rm: float | None = None
    category: str | None = None


class PetStatusResponse(BaseModel):
    profile: PetProfile
    nudge: PetNudge
    available_accessories: list[PetAccessory]
    xp_to_next_level: int
    progress_pct: int
