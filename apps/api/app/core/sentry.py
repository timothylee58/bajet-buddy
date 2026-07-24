from __future__ import annotations

import sentry_sdk
from fastapi import HTTPException

from app.core.config import Settings


def _before_send(event, hint):
    exc_info = hint.get("exc_info")
    if exc_info:
        exc = exc_info[1]
        if isinstance(exc, HTTPException) and exc.status_code < 500:
            return None
    return event


def init_sentry(settings: Settings) -> None:
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=1.0,
        send_default_pii=False,
        before_send=_before_send,
    )
