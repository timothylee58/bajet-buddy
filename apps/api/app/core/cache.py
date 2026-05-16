import redis.asyncio as aioredis
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            settings = get_settings()
            _redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await _redis.ping()
            logger.info("Redis connection OK")
        except Exception as e:
            logger.warning(f"Redis unavailable (non-fatal): {e}")
            _redis = None
    return _redis


async def cache_get(key: str) -> str | None:
    r = await get_redis()
    if r is None:
        return None
    try:
        return await r.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl: int = 300) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.set(key, value, ex=ttl)
    except Exception:
        pass
