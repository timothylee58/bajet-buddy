"""Refreshes Sentinel's live commodity data.

Runs each ingestion source, computes trend/change_pct against the previous
stored price, and upserts into `sentinel_commodity_prices`. One source
failing (network error, schema change, rate limit) never blocks the others —
each is isolated in its own try/except.

Callable two ways:
  - as a script: `python -m app.jobs.refresh_sentinel_data` (for a Railway cron job)
  - from the internal route: POST /api/sentinel/internal/refresh-data
"""
from __future__ import annotations

import asyncio
import logging

from app.core.database import get_supabase
from app.services.ingestion import bnm_fx, fuel_price

logger = logging.getLogger(__name__)

INGESTION_SOURCES = {
    "fuel_price": fuel_price.fetch_fuel_prices,
    "bnm_fx": bnm_fx.fetch_usd_myr_rate,
}


def _previous_price(supabase, source: str, symbol: str, before_date: str) -> float | None:
    try:
        res = (
            supabase.table("sentinel_commodity_prices")
            .select("current_price_display, price_date, raw_payload")
            .eq("source", source)
            .eq("symbol", symbol)
            .lt("price_date", before_date)
            .order("price_date", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        logger.warning("Failed to fetch previous price for %s/%s: %s", source, symbol, e)
        return None

    if not hasattr(res, "data") or not res.data:
        return None
    prior_payload = res.data.get("raw_payload") or {}
    prior_price = prior_payload.get("_prior_numeric_price")
    return float(prior_price) if prior_price is not None else None


def _with_trend(supabase, row: dict) -> dict:
    current_price = row.pop("_current_price", None)
    if current_price is None:
        row["trend"] = "flat"
        row["change_pct"] = 0.0
        return row

    prior = _previous_price(supabase, row["source"], row["symbol"], row["price_date"])
    if prior is None or prior == 0:
        row["trend"] = "flat"
        row["change_pct"] = 0.0
    else:
        change_pct = round(((current_price - prior) / prior) * 100, 2)
        row["change_pct"] = change_pct
        row["trend"] = "up" if change_pct > 0.1 else "down" if change_pct < -0.1 else "flat"

    # stash the numeric price inside raw_payload so tomorrow's run can diff against it
    raw = dict(row.get("raw_payload") or {})
    raw["_prior_numeric_price"] = current_price
    row["raw_payload"] = raw
    return row


async def refresh_sentinel_data() -> dict:
    supabase = get_supabase()
    if supabase is None:
        logger.warning("refresh_sentinel_data skipped — no Supabase credentials")
        return {"status": "skipped", "reason": "no supabase credentials", "sources": {}}

    results: dict[str, dict] = {}
    for name, fetch_fn in INGESTION_SOURCES.items():
        try:
            rows = await fetch_fn()
        except Exception as e:
            logger.exception("Ingestion source %s raised unexpectedly", name)
            results[name] = {"status": "error", "error": str(e), "rows": 0}
            continue

        if not rows:
            results[name] = {"status": "empty", "rows": 0}
            continue

        try:
            rows = [_with_trend(supabase, row) for row in rows]
            supabase.table("sentinel_commodity_prices").upsert(
                rows, on_conflict="source,symbol,price_date"
            ).execute()
            results[name] = {"status": "ok", "rows": len(rows)}
        except Exception as e:
            logger.exception("Failed to upsert rows for source %s", name)
            results[name] = {"status": "error", "error": str(e), "rows": 0}

    return {"status": "completed", "sources": results}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    summary = asyncio.run(refresh_sentinel_data())
    logger.info("Sentinel data refresh summary: %s", summary)
