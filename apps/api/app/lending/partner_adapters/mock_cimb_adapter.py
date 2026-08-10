"""Deterministic mock of a CIMB-shaped lending partner. No randomness on the
demo path — the same inputs always produce the same offers/decision, so
Sarah's seeded scenario is reproducible for the pitch.

Adaptation note: the spec's eligibility table references a "freeze_log
trigger_type = 'auto_bnpl'" that doesn't exist in this codebase — the real
freeze_events table only tags trigger_source ('auto'|'manual'|'buddy'|
'system'), with no BNPL-specific auto-trigger reason recorded. This adapter
treats "active freeze + outstanding BNPL balance" as the practical proxy for
"frozen because of BNPL overload."
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from app.lending.partner_adapters.base import (
    ApplicationResult,
    LendingContext,
    LendingPartnerAdapter,
    LoanOffer,
)

PARTNER_NAME = "CIMB Octo (mock)"
OFFER_TTL_DAYS = 14
_NAMESPACE = uuid.UUID("6f6d0c2a-8e6d-4f0a-9c1e-b6a1c9d8e2f0")


def _stable_id(*parts: str) -> str:
    """Deterministic UUID from inputs (uuid5) — same context always yields
    the same offer id, matching the "no randomness in the demo path"
    requirement while staying a valid value for the loan_offers.id column."""
    return str(uuid.uuid5(_NAMESPACE, "|".join(parts)))


class MockCimbAdapter(LendingPartnerAdapter):
    async def get_offers(
        self, user_id: str, score: int | None, factors: dict[str, float], context: LendingContext
    ) -> list[LoanOffer]:
        if score is None:
            return []

        offers: list[LoanOffer] = []
        expires_at = datetime.now(timezone.utc) + timedelta(days=OFFER_TTL_DAYS)

        if context.has_active_freeze and context.bnpl_outstanding > 0:
            offers.append(
                LoanOffer(
                    id=_stable_id(user_id, "bnpl_consolidation", str(int(context.bnpl_outstanding))),
                    partner_name=PARTNER_NAME,
                    product_type="bnpl_consolidation",
                    amount=round(context.bnpl_outstanding, 2),
                    apr=14.5,
                    tenure_months=12,
                    min_score_required=300,
                    reason=(
                        "You're currently frozen with outstanding BNPL balances — "
                        "this consolidates them into one lower-cost monthly payment."
                    ),
                    expires_at=expires_at,
                )
            )

        if (
            context.day_of_cycle > 20
            and context.monthly_income > 0
            and context.budget_remaining < 0.10 * context.monthly_income
            and score >= 580
        ):
            advance_amount = round(min(context.monthly_income * 0.5, 800), 2)
            offers.append(
                LoanOffer(
                    id=_stable_id(user_id, "salary_advance", str(int(advance_amount))),
                    partner_name=PARTNER_NAME,
                    product_type="salary_advance",
                    amount=advance_amount,
                    apr=8.0,
                    tenure_months=1,
                    min_score_required=580,
                    reason="You're late in your cycle with low runway — bridge to salary day at a fixed low rate.",
                    expires_at=expires_at,
                )
            )

        if score >= 670 and not context.has_active_freeze:
            offers.append(
                LoanOffer(
                    id=_stable_id(user_id, "micro_personal", str(score)),
                    partner_name=PARTNER_NAME,
                    product_type="micro_personal",
                    amount=1500.0,
                    apr=11.0,
                    tenure_months=6,
                    min_score_required=670,
                    reason="Your score qualifies you for a general-purpose personal financing line.",
                    expires_at=expires_at,
                )
            )

        return offers

    async def submit_application(
        self, offer_id: str, user_id: str, *, idempotency_key: str
    ) -> ApplicationResult:
        partner_reference = _stable_id("application", offer_id, idempotency_key)
        return ApplicationResult(partner_reference=partner_reference, status="submitted")

    async def get_application_status(self, partner_reference: str) -> str:
        # Deterministic mock decision: every submitted mock application
        # auto-approves. A real adapter would poll the partner or this
        # method would simply read the last webhook-delivered status.
        return "approved"
