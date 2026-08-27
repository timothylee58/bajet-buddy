"""KPDN retail prices — eggs, rice, cooking oil, chicken — from data.gov.my's
official PriceCatcher open dataset.

Earlier version of this module scraped pricecatcher.kpdn.gov.my's HTML with
guessed selectors. Turns out KPDN publishes the exact same price data as an
official open dataset instead — no scraping needed:
  - https://data.gov.my/data-catalogue/pricecatcher (transactional records,
    monthly Parquet files, ~2M price collections/month across wet markets,
    hypermarkets, supermarkets, and monitored retail shops)
  - https://data.gov.my/data-catalogue/lookup_item (item_code -> item name,
    unit, item_group, item_category)
Both are CC BY 4.0. This is the ToS-safe, officially-preferred path per
CLAUDE.md's "prefer official APIs over scraping" guidance — so this module
now hits those URLs directly instead of HTML.

IMPORTANT — schema below could NOT be verified against live data from this
development environment (its network egress is blocked to data.gov.my
entirely). Column names (item_code/item/unit/item_group/item_category on
the lookup table; date/premise_code/item_code/price on the transactional
table) come from data.gov.my's public documentation, not a live test run.
Ships **disabled by default** (`settings.kpdn_pricecatcher_enabled`) —
flip it on only after a run against real network access confirms the
columns match and prices come back sane.
"""
from __future__ import annotations

import io
import logging
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SOURCE = "data.gov.my (PriceCatcher)"
LOOKUP_ITEM_URL = "https://storage.data.gov.my/pricecatcher/lookup_item.parquet"
PRICECATCHER_URL_TMPL = "https://storage.data.gov.my/pricecatcher/pricecatcher_{month}.parquet"

# Matched against every string field on each lookup_item row, case-insensitive.
# Text search rather than a hardcoded item_code list — survives KPDN adding/
# renumbering catalogue items better than pinned codes would.
_ITEM_KEYWORDS = {
    "EGGS": {"keywords": ["telur gred a", "telur ayam gred a"], "name": "Eggs (10pcs)", "category": "groceries"},
    "RICE": {"keywords": ["beras super wangi", "beras cap"], "name": "Rice (10kg)", "category": "groceries"},
    "CPO": {"keywords": ["minyak masak sawit", "minyak masak kelapa sawit"], "name": "Cooking Oil (5kg)", "category": "groceries"},
    "CHKN": {"keywords": ["ayam standard", "ayam bersih"], "name": "Chicken (per kg)", "category": "groceries"},
}


async def _fetch_parquet_table(client: httpx.AsyncClient, url: str):
    import pyarrow.parquet as pq

    response = await client.get(url)
    response.raise_for_status()
    return pq.read_table(io.BytesIO(response.content))


async def _fetch_pricecatcher_month(client: httpx.AsyncClient, month: str):
    """Try the given YYYY-MM file, falling back one month if it 404s — the
    current month's file may not be published yet early in the month."""
    url = PRICECATCHER_URL_TMPL.format(month=month)
    try:
        return await _fetch_parquet_table(client, url), month
    except httpx.HTTPStatusError as e:
        if e.response.status_code != 404:
            raise
        prev_month_dt = datetime.strptime(month, "%Y-%m").replace(day=1) - timedelta(days=1)
        prev_month = prev_month_dt.strftime("%Y-%m")
        logger.info("pricecatcher_%s.parquet not published yet, trying %s", month, prev_month)
        url = PRICECATCHER_URL_TMPL.format(month=prev_month)
        return await _fetch_parquet_table(client, url), prev_month


def _match_item_codes(lookup_table) -> dict[int, str]:
    """Returns {item_code: our_symbol} for every lookup_item row whose text
    fields contain one of our keyword substrings."""
    import pyarrow.types as pat

    columns = lookup_table.column_names
    code_col = next((c for c in columns if c.lower() in ("item_code", "itemcode", "code")), None)
    if code_col is None:
        raise ValueError(f"lookup_item table has no recognizable item code column: {columns}")

    text_cols = [
        c for c in columns
        if pat.is_string(lookup_table.schema.field(c).type) or pat.is_large_string(lookup_table.schema.field(c).type)
    ]

    matches: dict[int, str] = {}
    rows = lookup_table.to_pylist()
    for row in rows:
        haystack = " ".join(str(row.get(c, "")) for c in text_cols).lower()
        for symbol, meta in _ITEM_KEYWORDS.items():
            if any(kw in haystack for kw in meta["keywords"]):
                matches[row[code_col]] = symbol
                break
    return matches


async def fetch_kpdn_prices() -> list[dict]:
    """Fetch eggs/rice/cooking-oil/chicken prices from data.gov.my's
    PriceCatcher dataset, averaged across premises for the latest date
    available in the current (or most recent published) month's file.

    Returns an empty list (never raises) when disabled, unreachable, or the
    schema doesn't match what's expected — the caller treats that as "no
    update this run" and scan_commodities() falls back to the mocked entry.
    """
    settings = get_settings()
    if not settings.kpdn_pricecatcher_enabled:
        logger.info("kpdn_prices ingestion skipped — KPDN_PRICECATCHER_ENABLED is not set")
        return []

    try:
        import pyarrow.compute as pc
    except ImportError:
        logger.warning("kpdn_prices ingestion skipped — pyarrow not installed")
        return []

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")

    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            lookup_table = await _fetch_parquet_table(client, LOOKUP_ITEM_URL)
            item_codes = _match_item_codes(lookup_table)
            if not item_codes:
                logger.warning("kpdn_prices: no lookup_item rows matched our keywords — schema may have changed")
                return []

            price_table, resolved_month = await _fetch_pricecatcher_month(client, current_month)
    except Exception as e:
        logger.warning("kpdn_prices ingestion failed: %s", e)
        return []

    columns = price_table.column_names
    item_col = next((c for c in columns if c.lower() in ("item_code", "itemcode")), None)
    date_col = next((c for c in columns if c.lower() == "date"), None)
    price_col = next((c for c in columns if c.lower() == "price"), None)
    if not (item_col and date_col and price_col):
        logger.warning("kpdn_prices: pricecatcher table missing expected columns, got %s", columns)
        return []

    try:
        import pyarrow as pa

        mask = pc.is_in(price_table[item_col], value_set=pa.array(list(item_codes.keys())))
        filtered = price_table.filter(mask)
        if filtered.num_rows == 0:
            logger.warning("kpdn_prices: no price rows for matched item codes in %s", resolved_month)
            return []

        latest_date = pc.max(filtered[date_col]).as_py()
        filtered = filtered.filter(pc.equal(filtered[date_col], latest_date))

        rows = filtered.to_pylist()
    except Exception as e:
        logger.warning("kpdn_prices: failed to filter/aggregate price table: %s", e)
        return []

    totals: dict[str, list[float]] = {}
    for row in rows:
        symbol = item_codes.get(row[item_col])
        if symbol is None:
            continue
        price = row.get(price_col)
        if price is None:
            continue
        totals.setdefault(symbol, []).append(float(price))

    price_date = str(latest_date)
    fetched_at = datetime.now(timezone.utc).isoformat()

    normalized: list[dict] = []
    for symbol, prices in totals.items():
        avg_price = sum(prices) / len(prices)
        meta = _ITEM_KEYWORDS[symbol]
        normalized.append(
            {
                "source": SOURCE,
                "symbol": symbol,
                "name": meta["name"],
                "category": meta["category"],
                "current_price_display": f"RM{avg_price:.2f}",
                "predicted_impact_rm": 0.0,
                "news_headline": f"PriceCatcher avg {meta['name']} price on {price_date} across {len(prices)} premises: RM{avg_price:.2f}",
                "news_source": "KPDN PriceCatcher",
                "price_date": price_date,
                "fetched_at": fetched_at,
                "raw_payload": {"premise_count": len(prices), "resolved_month": resolved_month},
                "_current_price": avg_price,
            }
        )

    return normalized
