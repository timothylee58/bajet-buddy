"""Live USD/MYR exchange rate from Bank Negara Malaysia's open API.

Official open-data API — no scraping, no auth required.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

BNM_FX_ENDPOINT = "https://api.bnm.gov.my/public/exchange-rate/USD"
SOURCE = "bnm.gov.my"


async def fetch_usd_myr_rate() -> list[dict]:
    """Fetch the latest published USD/MYR middle rate, normalized to a commodity price row.

    Returns an empty list (never raises) on any network/parse failure.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                BNM_FX_ENDPOINT,
                headers={"Accept": "application/vnd.BNM.API.v1+json"},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception as e:
        logger.warning("bnm_fx ingestion failed: %s", e)
        return []

    try:
        rate_data = payload["data"][0]["rate"]
        middle_rate = float(rate_data["middle_rate"])
        rate_date = payload["data"][0].get("date") or datetime.now(timezone.utc).date().isoformat()
    except (KeyError, IndexError, TypeError, ValueError) as e:
        logger.warning("bnm_fx ingestion: unexpected payload shape: %s", e)
        return []

    fetched_at = datetime.now(timezone.utc).isoformat()

    return [
        {
            "source": SOURCE,
            "symbol": "USDMYR",
            "name": "USD/MYR Exchange Rate",
            "category": "currency",
            "current_price_display": f"RM{middle_rate:.4f}",
            "predicted_impact_rm": 0.0,
            "news_headline": f"BNM middle rate for USD/MYR on {rate_date}: RM{middle_rate:.4f}",
            "news_source": "Bank Negara Malaysia",
            "price_date": rate_date,
            "fetched_at": fetched_at,
            "raw_payload": payload["data"][0],
            "_current_price": middle_rate,
        }
    ]
