from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from apps.api.tests.auth_override import install_auth_override
from app.services.persona_analyzer import analyze_persona

install_auth_override(app)


class PersonaAnalyzerTests(unittest.TestCase):
    def test_detects_midnight_shopee_queen(self) -> None:
        result = analyze_persona(
            transactions=[
                {"category": "shopping", "merchant": "Shopee Malaysia", "amount": 180, "created_at": datetime.fromisoformat("2026-05-16T23:30:00+08:00"), "bnpl": True},
                {"category": "shopping", "merchant": "TikTok Shop", "amount": 120, "created_at": datetime.fromisoformat("2026-05-15T22:40:00+08:00"), "bnpl": False},
                {"category": "food", "merchant": "FamilyMart", "amount": 20, "created_at": datetime.fromisoformat("2026-05-15T13:00:00+08:00"), "bnpl": False},
            ],
            monthly_income=3200,
            current_balance=340,
            bnpl_commitments=2,
            days_until_salary=7,
        )

        self.assertEqual(result["persona"].type, "midnight_shopee_queen")
        self.assertIn("Late-night", " ".join(result["persona"].top_signals))

    def test_detects_future_homeowner_from_stable_profile(self) -> None:
        now = datetime.now(timezone.utc)
        result = analyze_persona(
            transactions=[
                {"category": "utilities", "merchant": "TNB", "amount": 110, "created_at": now - timedelta(days=5), "bnpl": False},
                {"category": "transport", "merchant": "RapidKL", "amount": 45, "created_at": now - timedelta(days=3), "bnpl": False},
                {"category": "food", "merchant": "Lotus", "amount": 65, "created_at": now - timedelta(days=2), "bnpl": False},
            ],
            monthly_income=4200,
            current_balance=1800,
            bnpl_commitments=0,
            days_until_salary=4,
        )

        self.assertEqual(result["persona"].type, "future_homeowner")


class PersonaRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_post_analyze_returns_persona_with_rule(self) -> None:
        client = TestClient(app)
        now = datetime.now(timezone.utc).isoformat()
        response = client.post(
            "/api/persona/analyze",
            json={
                "transactions": [
                    {
                        "category": "shopping",
                        "merchant": "Shopee Malaysia",
                        "amount": 189,
                        "created_at": now,
                        "bnpl": True,
                    },
                    {
                        "category": "shopping",
                        "merchant": "TikTok Shop",
                        "amount": 91,
                        "created_at": now,
                        "bnpl": False,
                    },
                ],
                "monthly_income": 3200,
                "current_balance": 340,
                "bnpl_commitments": 2,
                "days_until_salary": 7,
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()["persona"]
        self.assertIn("suggested_intervention_rule", data)
        self.assertIn("explanation", data)
        self.assertGreaterEqual(data["confidence"], 0)
