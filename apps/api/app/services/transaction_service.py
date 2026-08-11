from __future__ import annotations

import logging

from app.core.database import get_supabase

logger = logging.getLogger(__name__)

async def get_user_transactions(user_id: str) -> list[dict]:
    client = get_supabase()
    if client is None:
        return []
    try:
        res = client.table("transactions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        # Every row is returned as-is: callers filter income and refunds themselves.
        return list(res.data)
    except Exception:
        logger.exception("Failed to fetch transactions")
        return []
