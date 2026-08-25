"""Live RON95/RON97/diesel prices from data.gov.my's open fuel price dataset.

Official open-data API — no scraping, no auth required.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

FUEL_PRICE_ENDPOINT = "https://api.data.gov.my/data-catalogue?id=fuelprice&limit=1&sort=-date"
SOURCE = "data.gov.my"

_SYMBOL_META = {
    "ron95": {"symbol": "RON95", "name": "RON95 Petrol", "category": "fuel", "unit": "RM/L"},
    "ron97": {"symbol": "RON97", "name": "RON97 Petrol", "category": "fuel", "unit": "RM/L"},
    "diesel": {"symbol": "DSL", "name": "Diesel", "category": "fuel", "unit": "RM/L"},
}


async def fetch_fuel_prices() -> list[dict]:
    """Fetch the latest published fuel prices, normalized to commodity price rows.

    Returns an empty list (never raises) on any network/parse failure — the caller
    is responsible for treating that as "this source produced nothing this run".
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(FUEL_PRICE_ENDPOINT)
            response.raise_for_status()
            payload = response.json()
    except Exception as e:
        logger.warning("fuel_price ingestion failed: %s", e)
        return []

    rows = payload if isinstance(payload, list) else payload.get("data", [])
    if not rows:
        logger.warning("fuel_price ingestion: empty response from %s", FUEL_PRICE_ENDPOINT)
        return []

    latest = rows[0]
    price_date = latest.get("date") or datetime.now(timezone.utc).date().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()

    normalized: list[dict] = []
    for field, meta in _SYMBOL_META.items():
        price = latest.get(field)
        if price is None:
            continue
        try:
            price = float(price)
        except (TypeError, ValueError):
            continue

        normalized.append(
            {
                "source": SOURCE,
                "symbol": meta["symbol"],
                "name": meta["name"],
                "category": meta["category"],
                "current_price_display": f"RM{price:.2f}/L",
                "predicted_impact_rm": 0.0,
                "news_headline": f"Official {meta['name']} price for {price_date}: RM{price:.2f}/L",
                "news_source": "data.gov.my (KPDN)",
                "price_date": price_date,
                "fetched_at": fetched_at,
                "raw_payload": latest,
                "_current_price": price,
            }
        )

    return normalized
