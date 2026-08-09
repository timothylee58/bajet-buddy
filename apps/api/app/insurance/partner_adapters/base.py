"""Abstract insurance partner interface — same pattern shape as
app.lending.partner_adapters.base (ABC, dataclass domain objects, async
methods, no shared class hierarchy since loan offers and insurance quotes
are genuinely different domains — the consistency the spec asks for is in
the *pattern*, not a forced shared type).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(slots=True)
class InsuranceQuote:
    product_type: str
    partner_name: str
    premium: float
    coverage_amount: float
    pitch: str


@dataclass(slots=True)
class PolicyResult:
    partner_reference: str
    status: str


class InsurancePartnerAdapter(ABC):
    @abstractmethod
    async def quote(self, product_type: str, amount: float) -> InsuranceQuote:
        """Price a policy for the given product type and covered amount."""
        ...

    @abstractmethod
    async def issue_policy(
        self, product_type: str, premium: float, coverage_amount: float, *, idempotency_key: str
    ) -> PolicyResult:
        """Bind coverage. Must be safe to retry with the same idempotency_key."""
        ...
