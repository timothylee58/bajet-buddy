from __future__ import annotations

from pydantic import BaseModel


class OnboardingAnswers(BaseModel):
    coffee_weekly: str
    guilt_purchase: str
    salary_day: str
    saving_style: str
    money_goal: str


class OnboardingRoast(BaseModel):
    persona_name: str
    persona_emoji: str
    roast: str
    encouragement: str
    estimated_monthly_waste: str
    top_weakness: str
    ai_tip: str
