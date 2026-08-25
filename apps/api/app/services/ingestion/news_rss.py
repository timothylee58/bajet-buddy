"""Fetches recent headlines from configured RSS feeds for macro-event detection.

RSS is preferred over scraping rendered news pages — stable format, published
by the outlet itself, no ToS ambiguity. Feed list is configurable via
SENTINEL_NEWS_FEEDS (comma-separated URLs) since not every outlet's feed URL
could be verified from this environment; the default ships with one feed
known to work (Free Malaysia Today) and more should be added once confirmed.
"""
from __future__ import annotations

import asyncio
import logging

import feedparser

from app.core.config import get_settings

logger = logging.getLogger(__name__)

MAX_HEADLINES_PER_FEED = 15


def _parse_feed(url: str) -> list[dict]:
    parsed = feedparser.parse(url)
    if parsed.bozo and not parsed.entries:
        raise ValueError(f"Feed did not parse: {parsed.bozo_exception}")

    source_name = parsed.feed.get("title", url)
    headlines = []
    for entry in parsed.entries[:MAX_HEADLINES_PER_FEED]:
        title = entry.get("title")
        if not title:
            continue
        headlines.append(
            {
                "title": title,
                "link": entry.get("link", ""),
                "source": source_name,
                "published": entry.get("published", ""),
            }
        )
    return headlines


async def fetch_headlines() -> list[dict]:
    """Fetch recent headlines across all configured feeds.

    Each feed is isolated — one broken/unreachable feed doesn't drop the
    others. Returns an empty list (never raises) if every feed fails.
    """
    settings = get_settings()
    feed_urls = [url.strip() for url in settings.sentinel_news_feeds.split(",") if url.strip()]
    if not feed_urls:
        return []

    headlines: list[dict] = []
    for url in feed_urls:
        try:
            # feedparser does blocking I/O — keep it off the event loop
            feed_headlines = await asyncio.to_thread(_parse_feed, url)
            headlines.extend(feed_headlines)
        except Exception as e:
            logger.warning("news_rss ingestion failed for feed %s: %s", url, e)
            continue

    return headlines
