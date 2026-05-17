from __future__ import annotations

import json
import re

import anthropic

from app.core.config import get_settings
from app.schemas.voice import VoiceParseResponse


async def parse_voice_transcript(transcript: str) -> VoiceParseResponse:
    settings = get_settings()
    model = settings.ilmu_model or "claude-opus-4-5"
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    if not api_key:
        return VoiceParseResponse(amount=None, merchant=None, category="other", item_name=None, confidence=0)

    client = anthropic.AsyncAnthropic(
        api_key=api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
    )

    message = await client.messages.create(
        model=model,
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Parse this spending transcript and respond strictly as JSON with exactly these keys: "
                    f"amount (float or null), merchant (string or null), "
                    f"category (one of: food, transport, shopping, entertainment, utilities, other), "
                    f"item_name (string or null), confidence (integer 0-100 how confident the extraction is). "
                    f"Return only valid JSON, no markdown.\n\nTranscript: {transcript}"
                ),
            }
        ],
    )

    raw_text = message.content[0].text.strip()
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)

    extracted = json.loads(raw_text)

    return VoiceParseResponse(
        amount=extracted.get("amount"),
        merchant=extracted.get("merchant"),
        category=str(extracted.get("category", "other")),
        item_name=extracted.get("item_name"),
        confidence=int(extracted.get("confidence", 0)),
        raw_transcript=transcript,
    )
