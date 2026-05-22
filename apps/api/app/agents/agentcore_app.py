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


def _import_strands() -> tuple[Any, Any, Any]:
    try:
        from strands import Agent, tool  # type: ignore[import-untyped]
        from strands.models import BedrockModel  # type: ignore[import-untyped]
        return Agent, tool, BedrockModel
    except ImportError as exc:
        raise ImportError("strands-agents is not installed. Run: pip install strands-agents") from exc


def _import_memory() -> Any:
    try:
        from bedrock_agentcore.memory import SummarizingConversationManager  # type: ignore[import-untyped]
        return SummarizingConversationManager
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# Tool definitions (registered at module level so ruff sees them)
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
    from app.schemas.check import PrePurchaseCheckRequest

    payload = PrePurchaseCheckRequest(
        amount=amount,
        merchant=merchant,
        category=category,
        essential=essential,
        merchant_type="discretionary",
        item_name=None,
        note=None,
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
# AgentCore app factory — called only when this module is run as __main__
# or explicitly imported for deployment.
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are BajetBuddy, a Malaysian AI financial coach that helps people spend wisely.
You speak Manglish (Malaysian English), BM, and English naturally — like a caring but firm friend.
You have access to tools to check purchases, analyse budgets, and give personalised nudges.
Always ground your advice in the user's actual budget data. Be warm, direct, and Malaysian."""


def build_agentcore_app() -> Any:
    BedrockAgentCoreApp = _import_agentcore()
    Agent, tool, BedrockModel = _import_strands()
    SummarizingConversationManager = _import_memory()

    from app.core.config import get_settings
    settings = get_settings()

    conversation_manager = (
        SummarizingConversationManager(summary_ratio=0.3, preserve_recent_messages=5)
        if SummarizingConversationManager is not None
        else None
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

    model_kwargs: dict[str, Any] = {
        "model_id": "us.anthropic.claude-haiku-4-5-20251001",
        "region_name": settings.bedrock_aws_region,
    }
    if settings.bedrock_guardrail_id:
        model_kwargs["guardrail_id"] = settings.bedrock_guardrail_id

    bedrock_model = BedrockModel(**model_kwargs)

    agentcore_app = BedrockAgentCoreApp()

    @agentcore_app.entrypoint
    async def invoke(payload: dict[str, Any]):  # type: ignore[misc]
        user_message = payload.get("prompt", "")
        user_id = payload.get("user_id", "00000000-0000-0000-0000-000000000001")

        agent_kwargs: dict[str, Any] = {
            "model": bedrock_model,
            "tools": [evaluate_purchase, get_budget_summary],
            "system_prompt": SYSTEM_PROMPT,
        }
        if conversation_manager is not None:
            agent_kwargs["conversation_manager"] = conversation_manager

        agent = Agent(**agent_kwargs)

        # Inject user_id context so tools can use it without the LLM guessing
        contextual_message = f"[user_id: {user_id}]\n{user_message}"

        async for event in agent.stream_async(contextual_message):
            if "data" in event:
                yield event["data"]

    return agentcore_app


if __name__ == "__main__":
    app = build_agentcore_app()
    app.run()
