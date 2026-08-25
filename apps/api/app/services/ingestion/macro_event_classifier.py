"""Classifies fetched news headlines into Sentinel's fixed MacroEventType set.

Uses the ilmu proxy (see CLAUDE.md) — same client construction as
app/nudge_agent/service.py. Falls back to producing nothing (never raises)
if the AI call fails or returns unusable JSON; the caller treats an empty
result as "no event detected this run", which is always a safe default.
"""
from __future__ import annotations

import json
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Kept in sync with MacroEventType in app/schemas/sentinel.py and
# EVENT_CATALOG in app/services/sentinel_service.py.
EVENT_TYPE_HINTS = {
    "grain_spike": "wheat, rice, or grain price/supply shock",
    "fuel_subsidy_cut": "RON95/diesel subsidy policy change or fuel price hike",
    "logistics_surge": "shipping/freight/port congestion driving up logistics costs",
    "currency_depreciation": "ringgit (MYR) weakening against major currencies",
    "electricity_tariff": "TNB or electricity tariff change",
    "palm_oil_shock": "palm oil / CPO price volatility or export restriction",
}

CONFIDENCE_THRESHOLD = 0.7


def _build_prompt(headlines: list[dict]) -> str:
    numbered = "\n".join(f"{i}. {h['title']} (source: {h['source']})" for i, h in enumerate(headlines))
    types_desc = "\n".join(f'- "{k}": {v}' for k, v in EVENT_TYPE_HINTS.items())

    return f"""You are a financial news classifier for a Malaysian personal finance app.
Given a numbered list of news headlines, identify which ones (if any) describe
a macro-economic event relevant to Malaysian household spending, and classify
each into exactly one of these event types:

{types_desc}

Headlines:
{numbered}

Return strict JSON only — a list of objects, one per headline you're confident
matches an event type. Skip headlines that don't clearly match any type or are
too vague/old to act on. Each object:
{{
  "headline_index": <int>,
  "event_type": "<one of the type keys above>",
  "confidence": <float 0-1>,
  "severity": <float 0-100, how severe/impactful this event is for household budgets>
}}

If no headline matches, return an empty JSON list: []"""


def _parse_response(text: str) -> list[dict]:
    start = text.find("[")
    end = text.rfind("]") + 1
    if start < 0 or end <= start:
        raise ValueError("AI response did not contain a JSON array")
    return json.loads(text[start:end])


async def classify_headlines(headlines: list[dict]) -> list[dict]:
    """Returns macro-event candidates for headlines the model is confident about.

    Each result: {event_type, severity, source_title, source_link, source_name}
    """
    if not headlines:
        return []

    settings = get_settings()
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    if not api_key:
        logger.info("macro_event_classifier skipped — no Anthropic/ilmu API key configured")
        return []

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(
            api_key=api_key,
            base_url=settings.ilmu_anthropic_base_url,
        )
        model = settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5"

        message = await client.messages.create(
            model=model,
            max_tokens=800,
            messages=[{"role": "user", "content": _build_prompt(headlines)}],
        )
        text = message.content[0].text.strip()
        raw_results = _parse_response(text)
    except Exception as e:
        logger.warning("macro_event_classifier failed: %s", e)
        return []

    results: list[dict] = []
    for item in raw_results:
        try:
            idx = int(item["headline_index"])
            event_type = item["event_type"]
            confidence = float(item.get("confidence", 0))
            severity = float(item.get("severity", 50))
        except (KeyError, TypeError, ValueError):
            continue

        if event_type not in EVENT_TYPE_HINTS:
            continue
        if confidence < CONFIDENCE_THRESHOLD:
            continue
        if idx < 0 or idx >= len(headlines):
            continue

        headline = headlines[idx]
        results.append(
            {
                "event_type": event_type,
                "severity": max(0.0, min(100.0, severity)),
                "source_title": headline["title"],
                "source_link": headline.get("link", ""),
                "source_name": headline.get("source", ""),
            }
        )

    return results
