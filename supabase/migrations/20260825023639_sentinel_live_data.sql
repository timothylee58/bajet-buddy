-- Sentinel real-time data ingestion: tables for scraped/fetched commodity prices
-- and macro events, replacing the hardcoded COMMODITY_CATALOG / EVENT_CATALOG
-- mocks in apps/api/app/services/sentinel_service.py.
-- NOT auto-applied to prod — apply manually against the live Supabase project.

CREATE TABLE IF NOT EXISTS sentinel_commodity_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_price_display TEXT NOT NULL,
    trend TEXT NOT NULL DEFAULT 'flat' CHECK (trend IN ('up', 'down', 'flat')),
    change_pct NUMERIC NOT NULL DEFAULT 0 CHECK (change_pct >= -100 AND change_pct <= 1000),
    predicted_impact_rm NUMERIC NOT NULL DEFAULT 0,
    news_headline TEXT,
    news_source TEXT,
    price_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_payload JSONB,
    UNIQUE (source, symbol, price_date)
);

CREATE INDEX IF NOT EXISTS sentinel_commodity_prices_symbol_idx
    ON sentinel_commodity_prices (symbol, price_date DESC);

CREATE TABLE IF NOT EXISTS sentinel_macro_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    title_bm TEXT NOT NULL,
    severity NUMERIC NOT NULL DEFAULT 0 CHECK (severity >= 0 AND severity <= 100),
    description TEXT,
    icon TEXT,
    source TEXT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS sentinel_macro_events_triggered_at_idx
    ON sentinel_macro_events (triggered_at DESC);
