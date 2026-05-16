from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from apps.api.tests.auth_override import install_auth_override
from app.schemas.simulation import FutureYouRequest
from app.services.simulation_service import simulate_future_you

install_auth_override(app)


class SimulationServiceTests(unittest.TestCase):
    def test_future_you_prefers_saving_or_skipping_over_bnpl(self) -> None:
        response = simulate_future_you(
            FutureYouRequest(
                question="Should I buy a RM3,500 iPhone on BNPL?",
                purchase_amount=3500,
                purchase_name="iPhone",
                monthly_income=3200,
                current_balance=340,
                monthly_expenses=2100,
                monthly_savings_contribution=150,
                emergency_fund=800,
                bnpl_monthly_payment=0,
                bnpl_months=6,
            )
        )

        self.assertEqual(len(response.scenarios), 3)
        self.assertNotEqual(response.recommended_scenario_id, "buy_now_bnpl")
        self.assertIn("lowest stress score", response.summary)


class SimulationRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_post_future_you_returns_three_scenarios(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/simulations/future-you",
            json={
                "question": "Should I buy a RM3,500 iPhone on BNPL?",
                "purchase_amount": 3500,
                "purchase_name": "iPhone",
                "monthly_income": 3200,
                "current_balance": 340,
                "monthly_expenses": 2100,
                "monthly_savings_contribution": 150,
                "emergency_fund": 800,
                "bnpl_monthly_payment": 0,
                "bnpl_months": 6,
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["scenarios"]), 3)
        self.assertIn("verdict", data)
        self.assertIn("summary", data)
        self.assertIn("recommended_scenario_id", data)
