from __future__ import annotations

import sys
import unittest
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.services.budget_service import calculate_risk_score, get_budget_summary, get_verdict


class BudgetSummaryGuestModeTests(unittest.IsolatedAsyncioTestCase):
    async def test_no_user_id_returns_zeroed_summary_without_hitting_supabase(self) -> None:
        summary = await get_budget_summary(None)

        self.assertEqual(summary["total_income"], 0)
        self.assertEqual(summary["total_spent"], 0)
        self.assertEqual(summary["remaining"], 0)
        self.assertEqual(summary["daily_safe_amount"], 0)
        self.assertGreaterEqual(summary["days_left"], 1)

    async def test_no_user_id_never_divides_by_zero_days_left(self) -> None:
        # days_left is clamped to >= 1 in _current_month_days, so daily_safe_amount
        # must never raise ZeroDivisionError even on the last day of the month.
        summary = await get_budget_summary(None)
        self.assertIsInstance(summary["daily_safe_amount"], (int, float))


class RiskScoreTests(unittest.TestCase):
    def test_zero_or_negative_remaining_forces_max_risk(self) -> None:
        self.assertEqual(calculate_risk_score(amount=50, remaining=0, category="food"), 100)
        self.assertEqual(calculate_risk_score(amount=50, remaining=-20, category="food"), 100)

    def test_discretionary_category_bump_is_capped_at_100(self) -> None:
        score = calculate_risk_score(amount=90, remaining=100, category="shopping")
        self.assertLessEqual(score, 100)
        self.assertEqual(score, 95)  # base 85 (impact 90%) + 10 discretionary bump

    def test_low_impact_purchase_scores_low_risk(self) -> None:
        score = calculate_risk_score(amount=10, remaining=1000, category="transport")
        self.assertEqual(score, 15)


class VerdictThresholdTests(unittest.TestCase):
    def test_verdict_boundaries(self) -> None:
        self.assertEqual(get_verdict(39), "boleh")
        self.assertEqual(get_verdict(40), "fikir_dulu")
        self.assertEqual(get_verdict(69), "fikir_dulu")
        self.assertEqual(get_verdict(70), "jangan_dulu")


if __name__ == "__main__":
    unittest.main()
