from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class FreezeActivateRequest(BaseModel):
    type: Literal["soft", "hard"] = "soft"


class FreezeStatusOut(BaseModel):
    active: bool
    type: Literal["soft", "hard"]
    reason: Literal["auto", "manual", "buddy"]
    message: str
    can_override: bool
    override_cost_xp: int
    activated_at: datetime | None = None
