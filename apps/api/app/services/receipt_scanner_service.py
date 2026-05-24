from __future__ import annotations

import base64
import json
import logging
import re

import anthropic

from app.core.config import get_settings
from app.schemas.receipt import ReceiptScanResponse
from app.services.budget_service import get_category_budgets
from app.services.gamification_service import award_xp, get_gamification_status

logger = logging.getLogger("receipt_scanner")

CATEGORY_MAP = {
    "food": "food", "food & drinks": "food", "drink": "food", "drinks": "food",
    "beverage": "food", "restaurant": "food", "cafe": "food",
    "transport": "transport", "transportation": "transport", "grab": "transport",
    "petrol": "transport", "fuel": "transport",
    "shopping": "shopping", "retail": "shopping", "clothes": "shopping",
    "fashion": "shopping",
    "entertainment": "entertainment", "movie": "entertainment",
    "games": "entertainment", "gaming": "entertainment",
    "utilities": "utilities", "electricity": "utilities", "water": "utilities",
    "internet": "utilities", "telco": "utilities",
}


def _map_category(raw: str) -> str:
    normalized = raw.strip().lower()
    if normalized in CATEGORY_MAP:
        return CATEGORY_MAP[normalized]
    for key, cat_id in CATEGORY_MAP.items():
        if key in normalized:
            return cat_id
    return "other"


def _build_response(
    store_name: str, item: str, amount: float, raw_category: str, user_id: str,
) -> ReceiptScanResponse:
    category_id = _map_category(raw_category)
    categories = get_category_budgets(user_id)
    cat_data = next((c for c in categories if c["id"] == category_id), None)
    if cat_data is None and categories:
        cat_data = categories[0]

    allocated = cat_data["allocated"] if cat_data else 400.0
    category_name = cat_data["name"] if cat_data else raw_category.title()
    category_average = allocated / 4

    under_category_average = amount < category_average
    xp_awarded = 0
    badge = None
    if under_category_average:
        xp_awarded = 50
        badge = "Budget Warrior"
        award_xp(user_id, xp_awarded)

    gamification_status = get_gamification_status(user_id)

    return ReceiptScanResponse(
        store_name=store_name,
        item=item,
        amount=amount,
        category=category_name,
        category_id=category_id,
        currency="MYR",
        under_category_average=under_category_average,
        category_average=category_average,
        xp_awarded=xp_awarded,
        badge=badge,
        gamification_status=gamification_status,
    )


async def scan_receipt(image_bytes: bytes, media_type: str, user_id: str) -> ReceiptScanResponse:
    settings = get_settings()
    image_data = base64.standard_b64encode(image_bytes).decode("utf-8")

    # --- Attempt 1: Anthropic Vision (Claude) ---
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    if api_key:
        try:
            return await _scan_with_anthropic(image_data, media_type, user_id, settings)
        except Exception as e:
            logger.warning("Anthropic receipt scan failed, falling back to DeepSeek: %s", e)

    # --- Attempt 2: DeepSeek Vision (fallback) ---
    if settings.deepseek_api_key:
        try:
            return await _scan_with_deepseek(image_data, user_id, settings)
        except Exception as e:
            logger.warning("DeepSeek fallback also failed: %s", e)

    # --- Attempt 3: OpenAI Vision (last resort) ---
    if settings.openai_api_key:
        try:
            return await _scan_with_openai(image_data, media_type, user_id, settings)
        except Exception as e:
            raise RuntimeError(f"All receipt scanning APIs failed: {e}")

    raise RuntimeError(
        "No API key configured for receipt scanning "
        "(set ILMU_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY)"
    )


async def _scan_with_anthropic(
    image_data: str, media_type: str, user_id: str, settings,
) -> ReceiptScanResponse:
    model = settings.ilmu_model or "claude-opus-4-5"
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    base_url = settings.ilmu_anthropic_base_url

    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)

    message = await client.messages.create(
        model=model,
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        "Extract the following from this receipt image and respond strictly as JSON "
                        "with exactly these keys: store_name, item, amount, category. "
                        "store_name is the merchant/store name. "
                        "item is the main purchased item or a brief summary. "
                        "amount is the total amount as a number (no currency symbol). "
                        "category is one of: food, transport, shopping, entertainment, utilities, other. "
                        "Return only valid JSON, no markdown."
                    ),
                },
            ],
        }],
    )

    raw_text = message.content[0].text.strip()
    extracted = _parse_json_response(raw_text)

    return _build_response(
        store_name=str(extracted.get("store_name", "Unknown Store")),
        item=str(extracted.get("item", "Purchase")),
        amount=float(extracted.get("amount", 0.0)),
        raw_category=str(extracted.get("category", "other")),
        user_id=user_id,
    )


async def _scan_with_deepseek(
    image_data: str, user_id: str, settings,
) -> ReceiptScanResponse:
    """Fallback: use DeepSeek Vision via OpenAI-compatible endpoint."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url="https://api.deepseek.com/v1",
    )

    response = await client.chat.completions.create(
        model="deepseek-chat",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                },
                {
                    "type": "text",
                    "text": (
                        "Extract the following from this receipt image and respond strictly as JSON "
                        "with exactly these keys: store_name, item, amount, category. "
                        "store_name is the merchant/store name. "
                        "item is the main purchased item or a brief summary. "
                        "amount is the total amount as a number (no currency symbol). "
                        "category is one of: food, transport, shopping, entertainment, utilities, other. "
                        "Return only valid JSON, no markdown."
                    ),
                },
            ],
        }],
    )

    raw_text = response.choices[0].message.content.strip()
    extracted = _parse_json_response(raw_text)

    return _build_response(
        store_name=str(extracted.get("store_name", "Unknown Store")),
        item=str(extracted.get("item", "Purchase")),
        amount=float(extracted.get("amount", 0.0)),
        raw_category=str(extracted.get("category", "other")),
        user_id=user_id,
    )


async def _scan_with_openai(
    image_data: str, media_type: str, user_id: str, settings,
) -> ReceiptScanResponse:
    """Last resort: use OpenAI Vision."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    response = await client.chat.completions.create(
        model="gpt-4o",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{image_data}"},
                },
                {
                    "type": "text",
                    "text": (
                        "Extract the following from this receipt image and respond strictly as JSON "
                        "with exactly these keys: store_name, item, amount, category. "
                        "store_name is the merchant/store name. "
                        "item is the main purchased item or a brief summary. "
                        "amount is the total amount as a number (no currency symbol). "
                        "category is one of: food, transport, shopping, entertainment, utilities, other. "
                        "Return only valid JSON, no markdown."
                    ),
                },
            ],
        }],
    )

    raw_text = response.choices[0].message.content.strip()
    extracted = _parse_json_response(raw_text)

    return _build_response(
        store_name=str(extracted.get("store_name", "Unknown Store")),
        item=str(extracted.get("item", "Purchase")),
        amount=float(extracted.get("amount", 0.0)),
        raw_category=str(extracted.get("category", "other")),
        user_id=user_id,
    )


def _parse_json_response(raw_text: str) -> dict:
    """Strip markdown fences and parse JSON from AI response."""
    clean = raw_text.strip()
    # Remove ``` fences
    clean = re.sub(r"^```(?:json)?\s*\n?", "", clean)
    clean = re.sub(r"\n?\s*```$", "", clean)
    clean = clean.strip()
    # Try to find JSON object
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start >= 0 and end > start:
        clean = clean[start:end]
    return json.loads(clean)
