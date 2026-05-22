from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.auth import AuthenticatedUser, get_optional_user
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


class AgentCoreChatRequest(BaseModel):
    prompt: str = Field(..., description="User message to send to the AgentCore runtime")
    session_id: str | None = Field(None, description="Session ID for conversation continuity")


class AgentCoreChatResponse(BaseModel):
    response: str
    session_id: str | None = None


async def _stream_from_agentcore(
    runtime_arn: str,
    region: str,
    bearer_token: str,
    session_id: str | None,
    payload: dict,
) -> AsyncGenerator[str, None]:
    """Stream SSE chunks from the AgentCore runtime endpoint."""
    url = f"https://bedrock-agentcore.{region}.amazonaws.com/runtimes/{runtime_arn}/invocations"
    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
    }
    if session_id:
        headers["X-Amzn-Bedrock-AgentCore-Runtime-Session-Id"] = session_id

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield line[6:]
                elif line:
                    yield line


@router.post("/chat")
async def agentcore_chat(
    body: AgentCoreChatRequest,
    current_user: AuthenticatedUser | None = Depends(get_optional_user),
) -> StreamingResponse:
    """Proxy a chat message to the deployed AgentCore runtime and stream back the response.

    Requires AGENTCORE_RUNTIME_ARN and AGENTCORE_BEARER_TOKEN to be set in the environment.
    Falls back to a 501 when the runtime is not configured, so the existing /api/check
    routes continue to work unchanged.
    """
    settings = get_settings()
    runtime_arn = getattr(settings, "agentcore_runtime_arn", "")
    bearer_token = getattr(settings, "agentcore_bearer_token", "")

    if not runtime_arn or not bearer_token:
        raise HTTPException(
            status_code=501,
            detail="AgentCore runtime not configured. Set AGENTCORE_RUNTIME_ARN and AGENTCORE_BEARER_TOKEN.",
        )

    user_id = current_user.user_id if current_user else settings.demo_user_id
    payload = {"prompt": body.prompt, "user_id": user_id}

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in _stream_from_agentcore(
                runtime_arn=runtime_arn,
                region=settings.bedrock_aws_region,
                bearer_token=bearer_token,
                session_id=body.session_id,
                payload=payload,
            ):
                yield f"data: {chunk}\n\n"
        except httpx.HTTPStatusError as exc:
            logger.error("AgentCore invocation failed: %s", exc)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
