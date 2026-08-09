"""Deterministic mock of an Etiqa-shaped insurance partner.

bnpl_default_protection: premium = active_bnpl_balance x 0.015 (monthly)
purchase_protection:     premium = purchase_amount x 0.03 (one-time, 90 days)
"""
from __future__ import annotations

import uuid

from app.insurance.partner_adapters.base import (
    InsuranceQuote,
    InsurancePartnerAdapter,
    PolicyResult,
)

PARTNER_NAME = "Etiqa (mock)"
BNPL_PROTECTION_RATE = 0.015
PURCHASE_PROTECTION_RATE = 0.03
_NAMESPACE = uuid.UUID("3a1f6e7c-2b4d-4c8e-9a0f-1d2e3f4a5b6c")

_PITCHES = {
    "bnpl_default_protection": "Covers your BNPL repayments if you miss a payment — peace of mind, not a penalty.",
    "purchase_protection": "Covers this item for 90 days against damage or non-delivery.",
}


class MockEtiqaAdapter(InsurancePartnerAdapter):
    async def quote(self, product_type: str, amount: float) -> InsuranceQuote:
        if product_type == "bnpl_default_protection":
            premium = round(amount * BNPL_PROTECTION_RATE, 2)
        else:
            premium = round(amount * PURCHASE_PROTECTION_RATE, 2)

        return InsuranceQuote(
            product_type=product_type,
            partner_name=PARTNER_NAME,
            premium=premium,
            coverage_amount=round(amount, 2),
            pitch=_PITCHES.get(product_type, "Coverage available."),
        )

    async def issue_policy(
        self, product_type: str, premium: float, coverage_amount: float, *, idempotency_key: str
    ) -> PolicyResult:
        partner_reference = str(uuid.uuid5(_NAMESPACE, f"{product_type}|{premium}|{idempotency_key}"))
        return PolicyResult(partner_reference=partner_reference, status="active")
