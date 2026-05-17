from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, get_current_user
from app.schemas.voice import VoiceParseRequest, VoiceParseResponse
from app.services.voice_parse_service import parse_voice_transcript

router = APIRouter()


@router.post("/parse", response_model=VoiceParseResponse)
async def parse_voice(
    payload: VoiceParseRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> VoiceParseResponse:
    return await parse_voice_transcript(payload.transcript)
