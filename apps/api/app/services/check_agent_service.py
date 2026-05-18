from __future__ import annotations

from app.agents import run_prepurchase_reasoning_graph
from app.schemas.check import CheckRequest, CheckResponse, FreezeSnapshot, PersonaSnapshot
from app.services.gamification_service import award_xp_for_verdict


VERDICT_MAP = {
    "BOLEH": "boleh",
    "FIKIR_DULU": "fikir_dulu",
    "JANGAN_DULU": "jangan_dulu",
}


async def run_manual_prepurchase_check(payload: CheckRequest, user_id: str = "00000000-0000-0000-0000-000000000001") -> CheckResponse:
    state = await run_prepurchase_reasoning_graph(payload, user_id=user_id)
    risk = state.risk_result
    nudge = state.nudge_result
    verdict = VERDICT_MAP[risk.verdict]
    budget = state.budget_summary
    xp_event = award_xp_for_verdict(user_id, verdict, action_at=payload.purchase_at)
    xp = xp_event["xp_earned"]
    budget_impact_pct = min((payload.amount / max(budget["remaining"], 1)) * 100, 100)

    return CheckResponse(
        verdict=verdict,
        nudge_bm=nudge.examples["bm"],
        nudge_en=nudge.examples["en"],
        risk_score=risk.risk_score,
        budget_impact_pct=round(budget_impact_pct, 1),
        xp_earned=xp,
        reason_codes=risk.reason_codes,
        recommended_action=risk.recommended_action,
        explanation=nudge.explanation,
        tradeoff=nudge.tradeoff,
        alternative_action=nudge.alternative_action,
        cta_buttons=nudge.cta_buttons,
        projected_remaining_balance=risk.projected_remaining_balance,
        projected_daily_survival_amount=risk.projected_daily_survival_amount,
        proactive_alert=state.proactive_alert,
        proactive_trigger_reason=state.proactive_reason,
        persona=PersonaSnapshot(
            type=state.persona["type"],
            name=state.persona["name"],
            emoji=state.persona["emoji"],
            description=state.persona["description"],
            confidence=state.persona["confidence"],
        ),
        freeze_status=FreezeSnapshot(**state.freeze_status) if state.freeze_status else None,
        pipeline_trace=state.trace,
    )
