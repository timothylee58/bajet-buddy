from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from app.services.progressive_profiling_service import _goal_store
from app.services.gamification_service import _gamification_store
from apps.api.tests.auth_override import install_auth_override

install_auth_override(app)


class ProgressiveProfilingTests(unittest.TestCase):
    def setUp(self) -> None:
        _goal_store.clear()
        _gamification_store.clear()
        install_auth_override(app)

    def test_summary_shows_progressive_layers(self) -> None:
        client = TestClient(app)
        response = client.get("/api/profiling/summary")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["principle"], "Data comes from value, not before value.")
        self.assertEqual(len(data["layers"]), 4)
        self.assertEqual(data["layers"][0]["title"], "Layer 0 - Instant Gratification")
        self.assertEqual(data["layers"][2]["status"], "active")
        self.assertEqual(data["unlockable_agents"][2]["code"], "pattern_detective")

    def test_goal_activation_unlocks_goal_directed_layer(self) -> None:
        client = TestClient(app)
        response = client.post(
            "/api/profiling/goals/activate",
            json={"type": "emergency_fund", "commitment_amount": 500},
        )

        self.assertEqual(response.status_code, 200)
        summary = response.json()["summary"]
        self.assertEqual(summary["layers"][3]["status"], "active")
        active_goals = [goal for goal in summary["goals"] if goal["started"]]
        self.assertEqual(len(active_goals), 1)
        self.assertEqual(active_goals[0]["type"], "emergency_fund")
        self.assertEqual(summary["unlockable_agents"][1]["status"], "unlocked")


if __name__ == "__main__":
    unittest.main()
