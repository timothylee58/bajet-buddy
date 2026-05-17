from __future__ import annotations

import json
from typing import Literal, TypedDict

import anthropic
from pydantic import BaseModel

from app.core.config import get_settings

SpendingPattern = Literal["midnight_shopper", "payday_spender", "bnpl_addict", "food_delivery_spiral", "balanced"]


class TransactionSummary(TypedDict):
    category: str
    amount: float
    hour_of_day: int
    day_of_month: int
    used_bnpl: bool


class PatternDetectionResult(BaseModel):
    primary_pattern: SpendingPattern
    patterns: list[SpendingPattern]
    risk_insight: str
    recommended_alert: str


_pattern_store: dict[str, PatternDetectionResult] = {}


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def detect_patterns(user_id: str, transactions: list[TransactionSummary]) -> PatternDetectionResult:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
    )
    model = settings.ilmu_model or "claude-opus-4-5"

    tx_lines = "\n".join(
        f"- category={t['category']}, amount=RM{t['amount']:.2f}, hour={t['hour_of_day']}, "
        f"day_of_month={t['day_of_month']}, bnpl={t['used_bnpl']}"
        for t in transactions
    )

    prompt = (
        f"Analyse these {len(transactions)} transactions for a Malaysian user:\n{tx_lines}\n\n"
        "Classify the spending behaviour. Valid pattern values: "
        "midnight_shopper, payday_spender, bnpl_addict, food_delivery_spiral, balanced.\n\n"
        "Return ONLY valid JSON with exactly these keys:\n"
        '- primary_pattern: the single dominant pattern (one of the valid values)\n'
        '- patterns: list of all detected patterns (subset of valid values)\n'
        '- risk_insight: 1 sentence in Manglish describing the risk\n'
        '- recommended_alert: 1 short push notification text (max 12 words)'
    )

    response = await client.messages.create(
        model=model,
        max_tokens=300,
        system="You are a financial pattern analyst for Malaysian users. Respond ONLY with valid JSON, no markdown fences.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text  # type: ignore[index]
    data = json.loads(_strip_fences(raw))
    result = PatternDetectionResult(**data)
    _pattern_store[user_id] = result
    return result


def get_cached_patterns(user_id: str) -> PatternDetectionResult | None:
    return _pattern_store.get(user_id)
