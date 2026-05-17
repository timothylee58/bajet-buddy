from __future__ import annotations

import base64
import json

import anthropic

from app.core.config import get_settings
from app.schemas.receipt import ReceiptScanResponse
from app.services.budget_service import get_category_budgets
from app.services.gamification_service import award_xp, get_gamification_status

CATEGORY_MAP = {
    "food": "food",
    "food & drinks": "food",
    "drink": "food",
    "drinks": "food",
    "beverage": "food",
    "restaurant": "food",
    "cafe": "food",
    "transport": "transport",
    "transportation": "transport",
    "grab": "transport",
    "petrol": "transport",
    "fuel": "transport",
    "shopping": "shopping",
    "retail": "shopping",
    "clothes": "shopping",
    "fashion": "shopping",
    "entertainment": "entertainment",
    "movie": "entertainment",
    "games": "entertainment",
    "gaming": "entertainment",
    "utilities": "utilities",
    "electricity": "utilities",
    "water": "utilities",
    "internet": "utilities",
    "telco": "utilities",
}


def _map_category(raw: str) -> str:
    normalized = raw.strip().lower()
    if normalized in CATEGORY_MAP:
        return CATEGORY_MAP[normalized]
    for key, cat_id in CATEGORY_MAP.items():
        if key in normalized:
            return cat_id
    return "other"


async def scan_receipt(image_bytes: bytes, media_type: str, user_id: str) -> ReceiptScanResponse:
    settings = get_settings()
    model = settings.ilmu_model or "claude-opus-4-5"
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    base_url = settings.ilmu_anthropic_base_url

    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)

    image_data = base64.standard_b64encode(image_bytes).decode("utf-8")

    message = await client.messages.create(
        model=model,
        max_tokens=512,
        messages=[
            {
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
            }
        ],
    )

    raw_text = message.content[0].text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    extracted = json.loads(raw_text)

    store_name = str(extracted.get("store_name", "Unknown Store"))
    item = str(extracted.get("item", "Purchase"))
    amount = float(extracted.get("amount", 0.0))
    raw_category = str(extracted.get("category", "other"))
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
