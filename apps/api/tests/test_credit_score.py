from __future__ import annotations

import asyncio
import sys
import time
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from app.risk_engine.credit_score import (
    _band_for_score,
    _budget_adherence,
    _has_sufficient_history,
    _velocity_stability,
    compute_credit_score,
)
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


def _tx(amount: float, days_ago: int, category: str = "food") -> dict:
    created_at = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
    return {"amount": amount, "category": category, "created_at": created_at}


class BandTests(unittest.TestCase):
    def test_band_boundaries(self) -> None:
        self.assertEqual(_band_for_score(300), "Poor")
        self.assertEqual(_band_for_score(579), "Poor")
        self.assertEqual(_band_for_score(580), "Fair")
        self.assertEqual(_band_for_score(669), "Fair")
        self.assertEqual(_band_for_score(670), "Good")
        self.assertEqual(_band_for_score(739), "Good")
        self.assertEqual(_band_for_score(740), "Very Good")
        self.assertEqual(_band_for_score(799), "Very Good")
        self.assertEqual(_band_for_score(800), "Excellent")
        self.assertEqual(_band_for_score(850), "Excellent")


class HistoryTests(unittest.TestCase):
    def test_no_transactions_is_insufficient(self) -> None:
        self.assertFalse(_has_sufficient_history([], datetime.now(timezone.utc)))

    def test_recent_only_transactions_are_insufficient(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(-20, days_ago=5), _tx(-15, days_ago=10)]
        self.assertFalse(_has_sufficient_history(txs, now))

    def test_transaction_older_than_90_days_is_sufficient(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(-20, days_ago=5), _tx(-15, days_ago=95)]
        self.assertTrue(_has_sufficient_history(txs, now))


class BudgetAdherenceTests(unittest.TestCase):
    def test_no_windows_with_data_returns_neutral(self) -> None:
        self.assertEqual(_budget_adherence([], 3000, datetime.now(timezone.utc)), 0.5)

    def test_zero_income_returns_neutral(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(-100, days_ago=5)]
        self.assertEqual(_budget_adherence(txs, 0, now), 0.5)

    def test_spend_within_income_scores_perfect_adherence(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(-500, days_ago=5), _tx(-500, days_ago=35), _tx(-500, days_ago=65)]
        self.assertEqual(_budget_adherence(txs, 3000, now), 1.0)

    def test_overspend_every_window_scores_zero(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(-5000, days_ago=5), _tx(-5000, days_ago=35), _tx(-5000, days_ago=65)]
        self.assertEqual(_budget_adherence(txs, 3000, now), 0.0)

    def test_income_transactions_are_excluded_from_spend(self) -> None:
        now = datetime.now(timezone.utc)
        txs = [_tx(3200, days_ago=5, category="income"), _tx(-100, days_ago=5)]
        self.assertEqual(_budget_adherence(txs, 3000, now), 1.0)


class VelocityStabilityTests(unittest.TestCase):
    def test_fewer_than_two_days_of_data_returns_neutral(self) -> None:
        txs = [_tx(-50, days_ago=1)]
        self.assertEqual(_velocity_stability(txs), 0.5)

    def test_flat_spend_pattern_scores_high_stability(self) -> None:
        txs = [_tx(-50, days_ago=d) for d in range(1, 10)]
        self.assertGreater(_velocity_stability(txs), 0.9)

    def test_spiky_spend_pattern_scores_lower_stability(self) -> None:
        spiky = [_tx(-500 if d % 3 == 0 else -10, days_ago=d) for d in range(1, 10)]
        flat = [_tx(-100, days_ago=d) for d in range(1, 10)]
        self.assertLess(_velocity_stability(spiky), _velocity_stability(flat))


class ComputeCreditScoreTests(unittest.TestCase):
    def test_new_user_without_history_returns_insufficient_flag_not_a_crash(self) -> None:
        # No Supabase configured in this environment -> get_user_transactions()
        # returns [] -> exercises the exact "new user, <90 days" spec case.
        result = asyncio.run(compute_credit_score("00000000-0000-0000-0000-00000000ffff"))
        self.assertTrue(result.insufficient_history)
        self.assertIsNone(result.score)
        self.assertIsNone(result.band)
        self.assertEqual(result.factors, [])


class LendingScoreRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_score_route_returns_valid_shape_quickly(self) -> None:
        client = TestClient(app)
        started = time.monotonic()
        response = client.get("/api/lending/score")
        elapsed_ms = (time.monotonic() - started) * 1000

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("insufficient_history", data)
        self.assertIn("factors", data)
        self.assertIn("computed_at", data)
        if not data["insufficient_history"]:
            self.assertGreaterEqual(data["score"], 300)
            self.assertLessEqual(data["score"], 850)
        self.assertLess(elapsed_ms, 500)


if __name__ == "__main__":
    unittest.main()
