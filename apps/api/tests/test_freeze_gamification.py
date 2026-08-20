from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.core.auth import DEMO_USER_ID
from app.main import app
from app.services.gamification_service import _gamification_store
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


class FreezeGamificationTests(unittest.TestCase):
    def setUp(self) -> None:
        _gamification_store.clear()
        install_auth_override(app)

    def test_check_awards_xp_and_status_reflects_new_total(self) -> None:
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
        self.assertEqual(response.json()["xp_earned"], 10)

        gamification = client.get("/api/gamification/status")
        self.assertEqual(gamification.status_code, 200)
        data = gamification.json()
        self.assertEqual(data["xp"], 430)
        self.assertEqual(data["level"], 2)

    def test_override_spends_xp_when_soft_freeze_is_active(self) -> None:
        client = TestClient(app)

        activated = client.post("/api/freeze/activate", json={"type": "soft"})
        self.assertEqual(activated.status_code, 200)
        self.assertTrue(activated.json()["active"])

        overridden = client.post("/api/freeze/override")
        self.assertEqual(overridden.status_code, 200)
        self.assertFalse(overridden.json()["active"])

        gamification = client.get("/api/gamification/status")
        self.assertEqual(gamification.status_code, 200)
        self.assertEqual(gamification.json()["xp"], 370)

    def test_override_fails_when_xp_is_insufficient(self) -> None:
        # FORCE_DEMO_USER short-circuits get_optional_user to DEMO_USER_ID regardless
        # of the get_current_user override above, so routes key off DEMO_USER_ID.
        _gamification_store[DEMO_USER_ID] = {
            "xp": 20,
            "streak": 1,
            "last_active_date": None,
        }
        client = TestClient(app)

        client.post("/api/freeze/activate", json={"type": "soft"})
        overridden = client.post("/api/freeze/override")

        self.assertEqual(overridden.status_code, 403)
        self.assertIn("Not enough XP", overridden.json()["detail"])


if __name__ == "__main__":
    unittest.main()
