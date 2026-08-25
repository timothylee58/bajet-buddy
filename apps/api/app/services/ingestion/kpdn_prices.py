"""KPDN retail price catalogue scraper — eggs, rice, cooking oil, chicken.

Unlike fuel_price.py/bnm_fx.py, KPDN doesn't publish a free open-data API for
its price catalogue, so this is genuine HTML scraping and is inherently more
fragile than the official-API sources: a KPDN markup change breaks this
module without breaking the others.

Ships **disabled by default** (`settings.kpdn_catalog_url == ""`) because the
selectors below were written without live access to the site from this
environment and need verification/adjustment against the real page before
turning it on. Matching is done by searching for known Malay item names in
text nodes rather than brittle CSS classes, which survives minor markup
changes better than a fixed selector chain, but still needs a human to point
it at the real catalogue URL and confirm it parses.

To enable: set KPDN_CATALOG_URL in the environment to the live price
catalogue page, verify a manual run against real HTML, adjust
`_extract_price_near` if the real markup doesn't match the assumption below.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SOURCE = "kpdn.gov.my"

# Malay item names as they appear on KPDN's price catalogue, mapped to our
# commodity symbols. Matching on the item name text, not a fixed DOM position.
_ITEM_MATCHERS = {
    "EGGS": {"names": ["Telur Gred A", "Telur Ayam Gred A"], "name": "Eggs (10pcs)", "category": "groceries"},
    "RICE": {"names": ["Beras Super Wangi", "Beras Tempatan"], "name": "Rice (10kg)", "category": "groceries"},
    "CPO": {"names": ["Minyak Masak Sawit", "Minyak Masak Kelapa Sawit"], "name": "Cooking Oil (5kg)", "category": "groceries"},
    "CHKN": {"names": ["Ayam Standard", "Ayam Bersih"], "name": "Chicken (per kg)", "category": "groceries"},
}

_PRICE_RE = re.compile(r"RM\s?(\d+(?:\.\d{1,2})?)")


def _extract_price_near(html: str, item_names: list[str]) -> float | None:
    """Best-effort: find the first RM-prefixed price within ~200 chars of any
    of the item's known Malay names in the raw page text.

    This is intentionally loose (regex over raw HTML, not a DOM query) so it
    degrades gracefully across minor markup revisions — but it still needs a
    real page fetched once to confirm it lands on the right number and not,
    say, a delivery fee or an unrelated price on the same page.
    """
    for name in item_names:
        idx = html.find(name)
        if idx == -1:
            continue
        window = html[idx : idx + 200]
        match = _PRICE_RE.search(window)
        if match:
            return float(match.group(1))
    return None


async def fetch_kpdn_prices() -> list[dict]:
    """Fetch eggs/rice/cooking-oil/chicken prices from the KPDN catalogue.

    Returns an empty list (never raises) when disabled, unreachable, or the
    page doesn't parse — the caller treats that as "no update this run" and
    scan_commodities() falls back to the mocked catalog entry.
    """
    settings = get_settings()
    if not settings.kpdn_catalog_url:
        logger.info("kpdn_prices ingestion skipped — KPDN_CATALOG_URL not configured")
        return []

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(settings.kpdn_catalog_url)
            response.raise_for_status()
            html = response.text
    except Exception as e:
        logger.warning("kpdn_prices ingestion failed: %s", e)
        return []

    price_date = datetime.now(timezone.utc).date().isoformat()
    fetched_at = datetime.now(timezone.utc).isoformat()

    normalized: list[dict] = []
    for symbol, meta in _ITEM_MATCHERS.items():
        price = _extract_price_near(html, meta["names"])
        if price is None:
            logger.warning("kpdn_prices: could not locate a price for %s — selectors may need updating", symbol)
            continue

        normalized.append(
            {
                "source": SOURCE,
                "symbol": symbol,
                "name": meta["name"],
                "category": meta["category"],
                "current_price_display": f"RM{price:.2f}",
                "predicted_impact_rm": 0.0,
                "news_headline": f"KPDN catalogue price for {meta['name']} on {price_date}: RM{price:.2f}",
                "news_source": "KPDN Price Catalogue",
                "price_date": price_date,
                "fetched_at": fetched_at,
                "raw_payload": {"matched_name": meta["names"][0]},
                "_current_price": price,
            }
        )

    return normalized
