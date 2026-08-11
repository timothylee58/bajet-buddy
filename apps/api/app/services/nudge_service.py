"""
Nudge generation — uses Claude API when available, falls back to rule-based templates.
"""
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── Rule-based fallback nudges ────────────────────────────────────────────────

NUDGES = {
    "jangan_dulu": {
        "bm": "Jangan dulu! Bajet kau dah nak habis. Simpan duit untuk keperluan lain minggu ni.",
        "en": "Hold up! Your budget is almost gone. Save it for essentials this week.",
    },
    "fikir_dulu": {
        "bm": "Fikir dulu sebelum beli. Adakah ini keperluan atau sekadar kehendak? Cuba tanya diri sendiri.",
        "en": "Think before you buy. Is this a need or a want? Ask yourself first.",
    },
    "boleh": {
        "bm": "Boleh! Masih dalam bajet. Tapi jangan lupa jimat untuk hari-hari mendatang ya!",
        "en": "Go ahead! Still within budget. But keep saving for the days ahead!",
    },
}

SHOPPING_NUDGES = {
    "jangan_dulu": {
        "bm": "Jangan dulu! Shopee boleh tunggu. Bajet kau dah kritikal — simpan untuk makan dan transport.",
        "en": "Not now! Shopee can wait. Your budget is critical — save for food and transport.",
    },
    "fikir_dulu": {
        "bm": "Fikir dulu! Adakah item ni dalam wishlist lama? Kalau ya, tunggu sale lagi bagus.",
        "en": "Think first! Is this item on your old wishlist? If yes, wait for a better sale.",
    },
}


async def generate_nudge(
    verdict: str,
    amount: float,
    category: str,
    merchant: str,
    remaining: float,
) -> tuple[str, str]:
    """
    Returns (nudge_bm, nudge_en).
    Tries Claude API first; falls back to templates.
    """
    settings = get_settings()
    api_key = settings.ilmu_api_key or settings.anthropic_api_key

    if api_key and api_key.startswith("sk-"):
        try:
            return await _claude_nudge(
                verdict,
                amount,
                category,
                merchant,
                remaining,
                api_key,
                settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
                settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5",
            )
        except Exception as e:
            logger.warning(f"Claude nudge failed, using template: {e}")

    return _template_nudge(verdict, category)


async def _claude_nudge(
    verdict: str,
    amount: float,
    category: str,
    merchant: str,
    remaining: float,
    api_key: str,
    base_url: str | None,
    model: str,
) -> tuple[str, str]:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)

    prompt = f"""You are BajetBuddy, a friendly Malaysian personal finance AI that speaks Manglish (mix of BM and English).

A user wants to spend RM{amount:.2f} at {merchant} (category: {category}).
Verdict: {verdict}
Remaining budget: RM{remaining:.2f}

Write TWO short nudge messages (max 2 sentences each):
1. In Bahasa Malaysia / Manglish (warm, relatable, Malaysian tone)
2. In English (same message, translated)

Format your response as JSON:
{{"bm": "...", "en": "..."}}

Be direct, empathetic, and use Malaysian slang naturally (lah, kan, wei, etc.)."""

    message = await client.messages.create(
        model=model,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = message.content[0].text.strip()
    # Extract JSON from response
    start = text.find("{")
    end = text.rfind("}") + 1
    data = json.loads(text[start:end])
    return data["bm"], data["en"]


def _template_nudge(verdict: str, category: str) -> tuple[str, str]:
    if category == "shopping" and verdict in SHOPPING_NUDGES:
        n = SHOPPING_NUDGES[verdict]
    else:
        n = NUDGES.get(verdict, NUDGES["boleh"])
    return n["bm"], n["en"]
