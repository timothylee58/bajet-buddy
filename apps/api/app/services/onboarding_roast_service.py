from __future__ import annotations

import json
import logging
import re

import anthropic
from fastapi import HTTPException
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.onboarding import OnboardingAnswers, OnboardingRoast

logger = logging.getLogger(__name__)


def _extract_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model response")
    return json.loads(match.group(0))


async def generate_roast(answers: OnboardingAnswers) -> OnboardingRoast:
    settings = get_settings()
    if not (settings.ilmu_api_key or settings.anthropic_api_key or settings.openai_api_key):
        raise HTTPException(
            status_code=503,
            detail="No LLM API key configured (ILMU_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY)",
        )

    user_prompt = f"""Here are a user's answers to 5 financial habit questions:

1. Weekly coffee/drinks spend: {answers.coffee_weekly}
2. Biggest guilt purchase: {answers.guilt_purchase}
3. First thing on salary day: {answers.salary_day}
4. Saver or spender: {answers.saving_style}
5. #1 money goal: {answers.money_goal}

Based on these answers, respond ONLY with a JSON object (no markdown fences, no extra text) with exactly these fields:
{{
  "persona_name": "a fun, specific persona name (e.g. 'The Midnight Shopee Queen')",
  "persona_emoji": "one relevant emoji",
  "roast": "fun, slightly savage 2-3 sentence roast about their money habits",
  "encouragement": "warm 1-2 sentence encouragement",
  "estimated_monthly_waste": "estimated monthly waste range in RM (e.g. 'RM150-RM300')",
  "top_weakness": "their biggest financial weakness in a short phrase",
  "ai_tip": "one specific, actionable tip tailored to their situation"
}}"""

    if settings.ilmu_api_key or settings.anthropic_api_key:
        client = anthropic.AsyncAnthropic(
            api_key=settings.ilmu_api_key or settings.anthropic_api_key,
            base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
        )
        model = settings.ilmu_model or "claude-opus-4-5"
        message = await client.messages.create(
            model=model,
            max_tokens=1024,
            system=(
                "You are BajetBuddy, a fun, witty Malaysian personal finance AI. "
                "You speak in a mix of English and occasional Malay words (Manglish). "
                "Be warm but slightly savage — like a friend who tells you the truth."
            ),
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = message.content[0].text.strip()
    else:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are BajetBuddy, a fun, witty Malaysian personal finance AI. "
                        "You speak in a mix of English and occasional Malay words (Manglish). "
                        "Be warm but slightly savage — like a friend who tells you the truth."
                    ),
                },
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1024,
            temperature=0.7,
        )
        raw = response.choices[0].message.content or ""
        raw = raw.strip()
    # Strip markdown fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = _extract_json(raw)
        return OnboardingRoast(**data)
    except Exception as exc:
        logger.exception("Failed to parse onboarding roast JSON")
        raise HTTPException(
            status_code=502,
            detail="Model returned invalid JSON",
        ) from exc
