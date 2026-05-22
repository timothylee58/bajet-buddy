from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy imports — bedrock-agentcore and strands-agents are optional at import
# time so the regular FastAPI app still starts without AWS credentials.
# ---------------------------------------------------------------------------

def _import_agentcore() -> Any:
    try:
        from bedrock_agentcore import BedrockAgentCoreApp  # type: ignore[import-untyped]
        return BedrockAgentCoreApp
    except ImportError as exc:
        raise ImportError("bedrock-agentcore is not installed. Run: pip install bedrock-agentcore") from exc


def _import_strands() -> tuple[Any, Any, Any, Any]:
    try:
        from strands import Agent, tool  # type: ignore[import-untyped]
        from strands.models import BedrockModel  # type: ignore[import-untyped]
        # Fix 2: correct import path (strands, not bedrock_agentcore.memory)
        from strands.agent.conversation_manager import SummarizingConversationManager  # type: ignore[import-untyped]
        return Agent, tool, BedrockModel, SummarizingConversationManager
    except ImportError as exc:
        raise ImportError("strands-agents is not installed. Run: pip install strands-agents") from exc


# ---------------------------------------------------------------------------
# Tool implementation helpers (pure async functions, no @tool decorator here
# so they can be unit-tested without the strands runtime).
# ---------------------------------------------------------------------------

async def _evaluate_purchase_impl(
    amount: float,
    merchant: str,
    category: str,
    user_id: str,
    essential: bool = False,
    language: str = "manglish",
    tone: str = "friendly",
) -> dict[str, Any]:
    from app.agents.reasoning_graph import run_prepurchase_reasoning_graph
    # Fix 5: correct schema class name
    from app.schemas.check import CheckRequest

    payload = CheckRequest(
        amount=amount,
        merchant=merchant,
        category=category,
        essential=essential,
        merchant_type="discretionary",
        item_name=None,
        purchase_at=None,
        language_preference=language,  # type: ignore[arg-type]
        tone_mode=tone,  # type: ignore[arg-type]
    )
    state = await run_prepurchase_reasoning_graph(payload, user_id=user_id)
    if state.nudge_result is None:
        return {"error": "Nudge generation failed"}
    nudge = state.nudge_result
    return {
        "verdict": nudge.verdict,
        "short_nudge": nudge.short_nudge,
        "explanation": nudge.explanation,
        "tradeoff": nudge.tradeoff,
        "alternative_action": nudge.alternative_action,
        "cta_buttons": nudge.cta_buttons,
        "risk_score": state.risk_result.risk_score if state.risk_result else None,
        "persona": state.persona.get("name") if state.persona else None,
    }


async def _get_budget_impl(user_id: str) -> dict[str, Any]:
    from app.services.budget_service import get_budget_summary

    try:
        return await get_budget_summary(user_id)
    except Exception as exc:
        logger.warning("get_budget_summary failed: %s", exc)
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are BajetBuddy, a Malaysian AI financial coach that helps people spend wisely.
You speak Manglish (Malaysian English), BM, and English naturally — like a caring but firm friend.
You have access to tools to check purchases, analyse budgets, and give personalised nudges.
Always ground your advice in the user's actual budget data. Be warm, direct, and Malaysian."""


# ---------------------------------------------------------------------------
# AgentCore app factory
# ---------------------------------------------------------------------------

def build_agentcore_app() -> Any:
    BedrockAgentCoreApp = _import_agentcore()
    Agent, tool, BedrockModel, SummarizingConversationManager = _import_strands()

    from app.core.config import get_settings
    settings = get_settings()

    # Fix 2 (continued): SummarizingConversationManager now from strands
    conversation_manager = SummarizingConversationManager(
        summary_ratio=0.3,
        preserve_recent_messages=5,
    )

    @tool
    async def evaluate_purchase(
        amount: float,
        merchant: str,
        category: str,
        user_id: str,
        essential: bool = False,
        language: str = "manglish",
        tone: str = "friendly",
    ) -> str:
        """Run the full pre-purchase reasoning graph and return a spend verdict with nudge.

        Args:
            amount: Purchase amount in RM
            merchant: Merchant name (e.g. Shopee, Grab)
            category: Spending category (food, shopping, transport, entertainment, utilities)
            user_id: The authenticated user's UUID
            essential: Whether this is an essential purchase
            language: Response language — manglish, bm, or en
            tone: Tone mode — friendly, professional, manglish, strict, or encouraging
        """
        result = await _evaluate_purchase_impl(amount, merchant, category, user_id, essential, language, tone)
        return json.dumps(result)

    @tool
    async def get_budget_summary(user_id: str) -> str:
        """Fetch the user's current month budget summary including balance, spending, and daily runway.

        Args:
            user_id: The authenticated user's UUID
        """
        result = await _get_budget_impl(user_id)
        return json.dumps(result)

    # Fix 1: correct model ID (global. prefix + :0 version suffix) and temperature=0.0
    model_kwargs: dict[str, Any] = {
        "model_id": "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        "region_name": settings.bedrock_aws_region,
        "temperature": 0.0,
    }
    if settings.bedrock_guardrail_id:
        model_kwargs["guardrail_id"] = settings.bedrock_guardrail_id
        model_kwargs["guardrail_version"] = "DRAFT"
        model_kwargs["guardrail_trace"] = "enabled"

    bedrock_model = BedrockModel(**model_kwargs)

    # Fix 3: Agent instantiated once outside the entrypoint so conversation
    # memory persists across calls within the same process lifetime.
    agent = Agent(
        model=bedrock_model,
        tools=[evaluate_purchase, get_budget_summary],
        system_prompt=SYSTEM_PROMPT,
        conversation_manager=conversation_manager,
        callback_handler=None,  # suppress verbose strands output from polluting SSE stream
    )

    agentcore_app = BedrockAgentCoreApp()

    @agentcore_app.entrypoint
    async def invoke(payload: dict[str, Any]):  # type: ignore[misc]
        user_message = payload.get("prompt", "")
        user_id = payload.get("user_id", settings.demo_user_id)
        # Inject user_id so tools can use it without the LLM guessing
        contextual_message = f"[user_id: {user_id}]\n{user_message}"
        async for event in agent.stream_async(contextual_message):
            if "data" in event:
                yield event["data"]

    return agentcore_app


if __name__ == "__main__":
    app = build_agentcore_app()
    app.run()
