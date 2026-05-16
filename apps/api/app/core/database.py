from supabase import create_client, Client
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_key:
            logger.warning("Supabase credentials not set — running in mock mode")
            return None  # type: ignore
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


async def init_db():
    """Called at startup — validates DB connection."""
    client = get_supabase()
    if client is None:
        logger.warning("DB init skipped — no Supabase credentials")
        return
    try:
        # Lightweight ping
        client.table("profiles").select("id").limit(1).execute()
        logger.info("Supabase connection OK")
    except Exception as e:
        logger.warning(f"Supabase ping failed (non-fatal in dev): {e}")
