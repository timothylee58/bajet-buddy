from __future__ import annotations

from pydantic import BaseModel


class VoiceParseRequest(BaseModel):
    transcript: str


class VoiceParseResponse(BaseModel):
    amount: float | None
    merchant: str | None
    category: str
    item_name: str | None
    confidence: int
    raw_transcript: str
