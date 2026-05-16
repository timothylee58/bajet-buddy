from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from app.services.freeze_service import _freeze_store
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


class CheckAgentRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        _freeze_store.clear()
        install_auth_override(app)

    def test_manual_check_runs_reasoning_pipeline_and_returns_nudge(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/check",
            json={
                "amount": 189,
                "category": "shopping",
                "merchant": "Shopee Malaysia",
                "merchant_type": "discretionary",
                "item_name": "Dress",
                "language_preference": "manglish",
                "tone_mode": "friendly",
                "purchase_at": "2026-05-16T23:48:00+08:00",
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "jangan_dulu")
        self.assertTrue(data["proactive_alert"])
        self.assertIn("freeze_status", data)
        self.assertEqual(data["freeze_status"]["reason"], "auto")
        self.assertEqual(
            data["pipeline_trace"],
            [
                "observe_transaction_intent",
                "load_context",
                "evaluate_risk",
                "generate_nudge",
                "finalize_action",
            ],
        )
        self.assertEqual(data["persona"]["type"], "midnight_shopee_queen")
        self.assertEqual(len(data["cta_buttons"]), 3)

    def test_low_risk_manual_check_can_return_boleh_without_proactive_alert(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/check",
            json={
                "amount": 18,
                "category": "health",
                "merchant": "Guardian",
                "merchant_type": "essential",
                "essential": True,
                "language_preference": "en",
                "tone_mode": "professional",
                "purchase_at": "2026-05-16T14:00:00+08:00",
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "boleh")
        self.assertFalse(data["proactive_alert"])
        self.assertGreaterEqual(data["xp_earned"], 0)


if __name__ == "__main__":
    unittest.main()
