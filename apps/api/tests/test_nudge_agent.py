from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.main import app
from apps.api.tests.auth_override import install_auth_override
from app.nudge_agent.service import (
    BnplContextPayload,
    BudgetContextPayload,
    NudgeRequestModel,
    PersonaPayload,
    TransactionIntentPayload,
    UserProfilePayload,
    generate_nudge_package,
)

install_auth_override(app)


def make_request(**overrides: object) -> NudgeRequestModel:
    payload = NudgeRequestModel(
        user_profile=UserProfilePayload(
            name="Sarah", age=26, occupation="Fresh grad", monthly_income=3200
        ),
        transaction_intent=TransactionIntentPayload(
            amount=189,
            merchant="Shopee Malaysia",
            category="shopping",
            merchant_type="discretionary",
            item_name="Dress",
            essential=False,
        ),
        risk_score=84,
        budget_context=BudgetContextPayload(
            current_balance=340,
            days_until_salary=7,
            current_daily_survival_amount=48.57,
            projected_remaining_balance=151,
            projected_daily_survival_amount=21.57,
            category_budget_usage_pct=92,
            total_monthly_spending=2100,
        ),
        bnpl_context=BnplContextPayload(
            due_this_month=214,
            due_within_7_days=89,
            active_commitments=3,
        ),
        user_persona=PersonaPayload(
            code="midnight_shopee_queen",
            label="Midnight Shopee Queen",
            description="Late-night impulse buyer",
        ),
        language_preference="manglish",
        tone_mode="friendly",
        reason_codes=["DAILY_SURVIVAL_BELOW_RM25", "BNPL_DUE_SOON_DISCRETIONARY"],
    )
    for key, value in overrides.items():
        setattr(payload, key, value)
    return payload


class NudgeAgentTests(unittest.IsolatedAsyncioTestCase):
    async def test_template_fallback_generates_manglish_output(self) -> None:
        payload = make_request()

        with patch(
            "app.nudge_agent.service._generate_with_ai",
            new=AsyncMock(side_effect=RuntimeError("offline")),
        ):
            result = await generate_nudge_package(payload)

        self.assertEqual(result.verdict, "JANGAN_DULU")
        self.assertEqual(result.provider, "template")
        self.assertIn("tinggal", result.short_nudge.lower())
        self.assertIn("manglish", result.examples)

    async def test_low_risk_professional_nudge_can_be_boleh(self) -> None:
        payload = make_request(
            risk_score=22,
            language_preference="en",
            tone_mode="professional",
            budget_context=BudgetContextPayload(
                current_balance=900,
                days_until_salary=2,
                current_daily_survival_amount=450,
                projected_remaining_balance=711,
                projected_daily_survival_amount=355.5,
                category_budget_usage_pct=32,
                total_monthly_spending=1280,
            ),
            bnpl_context=BnplContextPayload(
                due_this_month=0,
                due_within_7_days=0,
                active_commitments=0,
            ),
            reason_codes=[],
        )

        with patch(
            "app.nudge_agent.service._generate_with_ai",
            new=AsyncMock(side_effect=RuntimeError("offline")),
        ):
            result = await generate_nudge_package(payload)

        self.assertEqual(result.verdict, "BOLEH")
        self.assertEqual(result.language, "en")
        self.assertEqual(len(result.cta_buttons), 3)


class NudgeRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        install_auth_override(app)

    def test_post_generate_returns_structured_nudge_payload(self) -> None:
        client = TestClient(app)

        response = client.post(
            "/api/nudges/generate",
            json={
                "user_profile": {
                    "name": "Sarah",
                    "age": 26,
                    "occupation": "Fresh grad",
                    "monthly_income": 3200,
                },
                "transaction_intent": {
                    "amount": 189,
                    "merchant": "Shopee Malaysia",
                    "category": "shopping",
                    "merchant_type": "discretionary",
                    "item_name": "Dress",
                    "essential": False,
                },
                "risk_score": 84,
                "budget_context": {
                    "current_balance": 340,
                    "days_until_salary": 7,
                    "current_daily_survival_amount": 48.57,
                    "projected_remaining_balance": 151,
                    "projected_daily_survival_amount": 21.57,
                    "category_budget_usage_pct": 92,
                    "total_monthly_spending": 2100,
                },
                "bnpl_context": {
                    "due_this_month": 214,
                    "due_within_7_days": 89,
                    "active_commitments": 3,
                },
                "user_persona": {
                    "code": "midnight_shopee_queen",
                    "label": "Midnight Shopee Queen",
                    "description": "Late-night impulse buyer",
                },
                "language_preference": "manglish",
                "tone_mode": "friendly",
                "reason_codes": [
                    "DAILY_SURVIVAL_BELOW_RM25",
                    "BNPL_DUE_SOON_DISCRETIONARY",
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "JANGAN_DULU")
        self.assertIn("short_nudge", data)
        self.assertIn("explanation", data)
        self.assertIn("tradeoff", data)
        self.assertIn("alternative_action", data)
        self.assertEqual(len(data["cta_buttons"]), 3)
        self.assertIn("bm", data["examples"])
        self.assertIn("en", data["examples"])
        self.assertIn("manglish", data["examples"])


if __name__ == "__main__":
    unittest.main()
