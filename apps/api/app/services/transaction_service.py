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
        
        # Format for output
        transactions = []
        for row in res.data:
            # We want to exclude income or process appropriately?
            # Actually frontend expects all transactions including income or specific categories.
            transactions.append(row)
            
        return transactions
    except Exception as e:
        logger.error(f"Failed to fetch transactions: {e}")
        return []
