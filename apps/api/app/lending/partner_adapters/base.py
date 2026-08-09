"""Abstract lending partner interface — shaped like a real Open Banking /
BNM-compliant lending API so swapping the mock adapter for a live one later
is a config change (which adapter class gets instantiated), not a rewrite.
Real partners require idempotency keys on write operations and communicate
async status changes via webhook callbacks; the mock honors both shapes.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class LoanOffer:
    id: str
    partner_name: str
    product_type: str
    amount: float
    apr: float
    tenure_months: int
    min_score_required: int
    reason: str
    expires_at: datetime


@dataclass(slots=True)
class ApplicationResult:
    partner_reference: str
    status: str


@dataclass(slots=True)
class LendingContext:
    """Applicant context a real partner's underwriting call would need —
    assembled by services.py from our own data, never queried by the
    adapter directly. Keeps the adapter decoupled from our schema."""
    has_active_freeze: bool
    bnpl_outstanding: float
    days_until_salary: int
    day_of_cycle: int
    budget_remaining: float
    monthly_income: float


class LendingPartnerAdapter(ABC):
    @abstractmethod
    async def get_offers(
        self, user_id: str, score: int | None, factors: dict[str, float], context: LendingContext
    ) -> list[LoanOffer]:
        """Return the offers this partner is willing to extend right now."""
        ...

    @abstractmethod
    async def submit_application(
        self, offer_id: str, user_id: str, *, idempotency_key: str
    ) -> ApplicationResult:
        """Submit an application. Must be safe to retry with the same
        idempotency_key without creating a duplicate at the partner."""
        ...

    @abstractmethod
    async def get_application_status(self, partner_reference: str) -> str:
        """Poll (or, in a real integration, be webhook-notified of) the
        partner's current decision status for a submitted application."""
        ...
