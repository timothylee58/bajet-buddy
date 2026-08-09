from __future__ import annotations

import asyncio
import sys
import unittest
from datetime import date
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.lending.partner_adapters.base import LendingContext
from app.lending.partner_adapters.mock_cimb_adapter import MockCimbAdapter
from app.lending.services import _build_repayment_schedule, _total_repayable
from app.main import app
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


def _ctx(**overrides: object) -> LendingContext:
    base = dict(
        has_active_freeze=False,
        bnpl_outstanding=0.0,
        days_until_salary=10,
        day_of_cycle=15,
        budget_remaining=1000.0,
        monthly_income=3200.0,
    )
    base.update(overrides)
    return LendingContext(**base)


class MockCimbAdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.adapter = MockCimbAdapter()

    def test_no_score_returns_no_offers(self) -> None:
        offers = asyncio.run(self.adapter.get_offers("u1", None, {}, _ctx()))
        self.assertEqual(offers, [])

    def test_bnpl_consolidation_appears_only_when_frozen_with_outstanding_bnpl(self) -> None:
        frozen_with_bnpl = asyncio.run(
            self.adapter.get_offers("u1", 600, {}, _ctx(has_active_freeze=True, bnpl_outstanding=500.0))
        )
        self.assertTrue(any(o.product_type == "bnpl_consolidation" for o in frozen_with_bnpl))

        not_frozen = asyncio.run(
            self.adapter.get_offers("u1", 600, {}, _ctx(has_active_freeze=False, bnpl_outstanding=500.0))
        )
        self.assertFalse(any(o.product_type == "bnpl_consolidation" for o in not_frozen))

        frozen_no_bnpl = asyncio.run(
            self.adapter.get_offers("u1", 600, {}, _ctx(has_active_freeze=True, bnpl_outstanding=0.0))
        )
        self.assertFalse(any(o.product_type == "bnpl_consolidation" for o in frozen_no_bnpl))

    def test_salary_advance_appears_for_low_runway_late_cycle_scenario(self) -> None:
        # Sarah's demo shape (low runway, late in the cycle, score qualifies).
        # NOTE: the spec's own RM340/RM3200 numbers are 10.6% of income —
        # just *above* its own stated "<10%" cutoff. Using RM200 here to
        # validate the rule fires correctly; see PR description for the
        # threshold discrepancy this surfaced in the spec's worked example.
        offers = asyncio.run(
            self.adapter.get_offers(
                "sarah",
                600,
                {},
                _ctx(day_of_cycle=25, budget_remaining=200.0, monthly_income=3200.0),
            )
        )
        self.assertTrue(any(o.product_type == "salary_advance" for o in offers))

    def test_salary_advance_absent_when_runway_is_healthy(self) -> None:
        offers = asyncio.run(
            self.adapter.get_offers(
                "u1", 600, {}, _ctx(day_of_cycle=25, budget_remaining=2000.0, monthly_income=3200.0)
            )
        )
        self.assertFalse(any(o.product_type == "salary_advance" for o in offers))

    def test_micro_personal_requires_670_and_no_active_freeze(self) -> None:
        qualifies = asyncio.run(self.adapter.get_offers("u1", 700, {}, _ctx(has_active_freeze=False)))
        self.assertTrue(any(o.product_type == "micro_personal" for o in qualifies))

        below_threshold = asyncio.run(self.adapter.get_offers("u1", 650, {}, _ctx(has_active_freeze=False)))
        self.assertFalse(any(o.product_type == "micro_personal" for o in below_threshold))

        frozen = asyncio.run(self.adapter.get_offers("u1", 700, {}, _ctx(has_active_freeze=True)))
        self.assertFalse(any(o.product_type == "micro_personal" for o in frozen))

    def test_offers_are_deterministic_across_calls(self) -> None:
        ctx = _ctx(has_active_freeze=True, bnpl_outstanding=500.0, day_of_cycle=25, budget_remaining=100.0)
        first = asyncio.run(self.adapter.get_offers("u1", 700, {}, ctx))
        second = asyncio.run(self.adapter.get_offers("u1", 700, {}, ctx))
        self.assertEqual([o.id for o in first], [o.id for o in second])

    def test_submit_application_returns_deterministic_reference(self) -> None:
        first = asyncio.run(self.adapter.submit_application("offer-1", "u1", idempotency_key="u1:offer-1"))
        second = asyncio.run(self.adapter.submit_application("offer-1", "u1", idempotency_key="u1:offer-1"))
        self.assertEqual(first.partner_reference, second.partner_reference)


class RepaymentScheduleTests(unittest.TestCase):
    def test_total_repayable_uses_simple_interest(self) -> None:
        # RM1000, 12% APR, 12 months -> 1000 * (1 + 0.12) = 1120
        self.assertEqual(_total_repayable(1000.0, 12.0, 12), 1120.0)

    def test_schedule_has_correct_installment_count_and_sums_to_total(self) -> None:
        total = 1200.0
        schedule = _build_repayment_schedule(total, 12, date(2026, 1, 1))
        self.assertEqual(len(schedule), 12)
        self.assertAlmostEqual(sum(r["amount"] for r in schedule), total, places=2)
        self.assertTrue(all(r["status"] == "upcoming" for r in schedule))


class LendingRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_offers_route_does_not_crash_without_supabase(self) -> None:
        client = TestClient(app)
        response = client.get("/api/lending/offers")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_apply_to_missing_offer_returns_404(self) -> None:
        client = TestClient(app)
        response = client.post("/api/lending/apply", json={"offer_id": "does-not-exist"})
        self.assertEqual(response.status_code, 404)

    def test_missing_application_returns_404(self) -> None:
        client = TestClient(app)
        response = client.get("/api/lending/applications/does-not-exist")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
