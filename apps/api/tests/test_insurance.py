from __future__ import annotations

import asyncio
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.insurance.partner_adapters.mock_etiqa_adapter import (
    BNPL_PROTECTION_RATE,
    PURCHASE_PROTECTION_RATE,
    MockEtiqaAdapter,
)
from app.insurance.services import PURCHASE_PROTECTION_MIN_AMOUNT, get_contextual_offer
from app.main import app
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


class MockEtiqaAdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.adapter = MockEtiqaAdapter()

    def test_bnpl_protection_premium_matches_formula(self) -> None:
        quote = asyncio.run(self.adapter.quote("bnpl_default_protection", 1000.0))
        self.assertAlmostEqual(quote.premium, round(1000.0 * BNPL_PROTECTION_RATE, 2))
        self.assertEqual(quote.coverage_amount, 1000.0)

    def test_purchase_protection_premium_matches_formula(self) -> None:
        quote = asyncio.run(self.adapter.quote("purchase_protection", 200.0))
        self.assertAlmostEqual(quote.premium, round(200.0 * PURCHASE_PROTECTION_RATE, 2))

    def test_issue_policy_is_deterministic_for_same_idempotency_key(self) -> None:
        first = asyncio.run(
            self.adapter.issue_policy("purchase_protection", 6.0, 200.0, idempotency_key="u1:purchase_protection:200.0")
        )
        second = asyncio.run(
            self.adapter.issue_policy("purchase_protection", 6.0, 200.0, idempotency_key="u1:purchase_protection:200.0")
        )
        self.assertEqual(first.partner_reference, second.partner_reference)
        self.assertEqual(first.status, "active")


class ContextualOfferTests(unittest.TestCase):
    def test_never_offered_on_jangan_dulu(self) -> None:
        # No Supabase configured in this environment -> also exercises the
        # "does not crash without a DB" path for the BNPL-outstanding lookup.
        offer = asyncio.run(get_contextual_offer("u1", "jangan_dulu", 500.0))
        self.assertIsNone(offer)

    def test_purchase_protection_requires_amount_above_threshold(self) -> None:
        offer = asyncio.run(get_contextual_offer("u1", "boleh", PURCHASE_PROTECTION_MIN_AMOUNT))
        self.assertIsNone(offer)

    def test_purchase_protection_offered_above_threshold(self) -> None:
        offer = asyncio.run(get_contextual_offer("u1", "boleh", PURCHASE_PROTECTION_MIN_AMOUNT + 1))
        self.assertIsNotNone(offer)
        self.assertEqual(offer.product_type, "purchase_protection")

    def test_fikir_dulu_can_also_receive_purchase_protection(self) -> None:
        offer = asyncio.run(get_contextual_offer("u1", "fikir_dulu", 200.0))
        self.assertIsNotNone(offer)
        self.assertEqual(offer.product_type, "purchase_protection")


class InsuranceRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_quote_route_returns_null_on_jangan_dulu(self) -> None:
        client = TestClient(app)
        response = client.post("/api/insurance/quote", json={"verdict": "jangan_dulu", "amount": 500})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())

    def test_quote_route_returns_offer_on_boleh(self) -> None:
        client = TestClient(app)
        response = client.post("/api/insurance/quote", json={"verdict": "boleh", "amount": 200})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["product_type"], "purchase_protection")

    def test_purchase_route_does_not_crash_without_supabase(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/insurance/purchase",
            json={"product_type": "purchase_protection", "premium": 6.0, "coverage_amount": 200.0},
        )
        self.assertEqual(response.status_code, 200)

    def test_policies_route_returns_empty_list_without_supabase(self) -> None:
        client = TestClient(app)
        response = client.get("/api/insurance/policies")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])


if __name__ == "__main__":
    unittest.main()
