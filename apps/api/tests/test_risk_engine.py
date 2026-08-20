from __future__ import annotations

import unittest
from datetime import datetime
from pathlib import Path
import sys

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from apps.api.tests.auth_override import install_auth_override
from app.risk_engine import RiskEvaluationInput, evaluate_risk

install_auth_override(app)


def make_payload(**overrides: object) -> RiskEvaluationInput:
    base = RiskEvaluationInput(
        amount=120,
        category="shopping",
        merchant="Shopee Malaysia",
        merchant_type="discretionary",
        purchase_at=datetime.fromisoformat("2026-05-16T23:30:00+08:00"),
        current_balance=340,
        days_until_salary=7,
        current_daily_survival_amount=48.57,
        category_budget_allocated=600,
        category_budget_spent=390,
        bnpl_due_this_month=214,
        bnpl_due_within_7_days=0,
        has_midnight_spending_pattern=True,
        historical_behaviour_score=72,
    )
    for key, value in overrides.items():
        setattr(base, key, value)
    return base


class RiskEngineUnitTests(unittest.TestCase):
    def test_daily_survival_below_rm25_forces_jangan_dulu(self) -> None:
        result = evaluate_risk(
            make_payload(amount=189, current_balance=340, days_until_salary=7)
        )

        self.assertEqual(result.verdict, "JANGAN_DULU")
        self.assertIn("DAILY_SURVIVAL_BELOW_RM25", result.reason_codes)
        self.assertAlmostEqual(result.projected_daily_survival_amount, 21.57, places=2)

    def test_category_budget_above_85_forces_fikir_dulu_floor(self) -> None:
        result = evaluate_risk(
            make_payload(
                amount=40,
                merchant_type="mixed",
                purchase_at=datetime.fromisoformat("2026-05-16T14:00:00+08:00"),
                has_midnight_spending_pattern=False,
                category_budget_spent=500,
                category_budget_allocated=600,
                bnpl_due_this_month=0,
                bnpl_due_within_7_days=0,
                historical_behaviour_score=25,
            )
        )

        self.assertEqual(result.verdict, "FIKIR_DULU")
        self.assertIn("CATEGORY_BUDGET_ABOVE_85", result.reason_codes)

    def test_bnpl_due_soon_and_discretionary_forces_jangan_dulu(self) -> None:
        # Amount-tier scaling only forces a block for medium+ purchases (tier >= 0.8,
        # i.e. amount >= RM80) — a micro/small BNPL purchase shouldn't trip this alarm.
        result = evaluate_risk(
            make_payload(amount=90, bnpl_due_within_7_days=120, merchant_type="discretionary")
        )

        self.assertEqual(result.verdict, "JANGAN_DULU")
        self.assertIn("BNPL_DUE_SOON_DISCRETIONARY", result.reason_codes)

    def test_essential_purchase_reduces_risk(self) -> None:
        discretionary = evaluate_risk(
            make_payload(
                amount=45,
                purchase_at=datetime.fromisoformat("2026-05-16T13:00:00+08:00"),
                has_midnight_spending_pattern=False,
                historical_behaviour_score=20,
                bnpl_due_this_month=0,
                merchant_type="discretionary",
            )
        )
        essential = evaluate_risk(
            make_payload(
                amount=45,
                category="health",
                merchant="Guardian",
                merchant_type="essential",
                purchase_at=datetime.fromisoformat("2026-05-16T13:00:00+08:00"),
                current_balance=480,
                days_until_salary=2,
                current_daily_survival_amount=120,
                has_midnight_spending_pattern=False,
                historical_behaviour_score=20,
                category_budget_allocated=250,
                category_budget_spent=60,
                bnpl_due_this_month=0,
            )
        )

        self.assertLess(essential.risk_score, discretionary.risk_score)
        self.assertEqual(essential.verdict, "BOLEH")
        self.assertIn("ESSENTIAL_PURCHASE_BUFFER", essential.reason_codes)

    def test_midnight_pattern_escalates_risk(self) -> None:
        result = evaluate_risk(
            make_payload(
                amount=95,
                bnpl_due_within_7_days=0,
                has_midnight_spending_pattern=True,
                purchase_at=datetime.fromisoformat("2026-05-16T23:55:00+08:00"),
            )
        )

        self.assertIn(result.verdict, {"FIKIR_DULU", "JANGAN_DULU"})
        self.assertIn("MIDNIGHT_SPENDING_PATTERN", result.reason_codes)


class RiskRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_post_evaluate_returns_ai_ready_json(self) -> None:
        client = TestClient(app)

        response = client.post(
            "/api/risk/evaluate",
            json={
                "amount": 189,
                "category": "shopping",
                "merchant": "Shopee Malaysia",
                "merchant_type": "discretionary",
                "purchase_at": "2026-05-16T23:48:00+08:00",
                "current_balance": 340,
                "days_until_salary": 7,
                "current_daily_survival_amount": 48.57,
                "category_budget_allocated": 600,
                "category_budget_spent": 500,
                "bnpl_due_this_month": 214,
                "bnpl_due_within_7_days": 89,
                "has_midnight_spending_pattern": True,
                "historical_behaviour_score": 78,
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "JANGAN_DULU")
        self.assertIn("risk_score", data)
        self.assertIn("reason_codes", data)
        self.assertIn("recommended_action", data)
        self.assertIn("projected_remaining_balance", data)
        self.assertIn("projected_daily_survival_amount", data)
        self.assertIn("ai_nudge_context", data)
        self.assertEqual(data["ai_nudge_context"]["merchant"], "Shopee Malaysia")


if __name__ == "__main__":
    unittest.main()
