from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app


class AuthGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        app.dependency_overrides.clear()

    def test_demo_routes_work_without_a_bearer_token(self) -> None:
        # FORCE_DEMO_USER=True maps every request to the demo profile via
        # get_optional_user, so these routes never 401 — see app/core/auth.py.
        client = TestClient(app)

        no_token_calls = [
            ("GET", "/api/transactions"),
            ("GET", "/api/persona"),
            ("GET", "/api/freeze/status"),
            ("POST", "/api/check"),
        ]

        for method, path in no_token_calls:
            if method == "POST":
                response = client.post(
                    path,
                    json={"amount": 50, "category": "shopping", "merchant": "Shopee"},
                )
            else:
                response = client.get(path)

            self.assertNotEqual(
                response.status_code, 401, f"{path} unexpectedly required auth"
            )

    def test_health_route_stays_public(self) -> None:
        client = TestClient(app)
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
