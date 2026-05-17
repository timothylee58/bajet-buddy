from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

SpendingCategory = Literal["groceries", "fuel", "food_delivery", "entertainment", "transport", "utilities"]

MerchantTag = Literal[
    "mydin", "lotusc", "nsk", "tesco", "jaya_grocer",
    "petronas", "shell", "caltex",
    "grabfood", "foodpanda", "shopee_food",
    "netflix", "spotify", "astro",
    "grab", "myrapid",
]

RiskLabel = Literal[
    "Grocery-Sensitive",
    "Fuel-Sensitive",
    "Vulnerable Consumer",
    "Food-Delivery Dependent",
    "Entertainment Spender",
    "Resilient Saver",
]

MacroEventType = Literal[
    "grain_spike",
    "fuel_subsidy_cut",
    "logistics_surge",
    "currency_depreciation",
    "electricity_tariff",
    "palm_oil_shock",
]


class MockTransaction(BaseModel):
    id: str
    merchant: str
    merchant_tag: MerchantTag
    category: SpendingCategory
    amount: float
    date: str


class SpendingSnapshot(BaseModel):
    category: SpendingCategory
    total_rm: float
    pct_of_spend: float
    transaction_count: int
    top_merchant: str
    sensitivity_score: float


class RiskProfile(BaseModel):
    primary_label: RiskLabel
    secondary_labels: list[RiskLabel]
    vulnerability_score: float
    most_exposed_category: SpendingCategory
    top_risk_merchants: list[str]


class MacroEvent(BaseModel):
    event_type: MacroEventType
    title: str
    title_bm: str
    severity: float
    description: str
    icon: str
    triggered_at: str


class CategoryImpact(BaseModel):
    category: SpendingCategory
    estimated_increase_rm: float
    estimated_increase_pct: float
    affected_merchants: list[str]


class MacroImpactResult(BaseModel):
    event: MacroEvent
    total_monthly_impact_rm: float
    category_impacts: list[CategoryImpact]
    ai_intervention_title: str
    ai_intervention_bm: str
    ai_intervention_body: str
    persona_emoji: str
    persona_name: str
    severity_label: str


class InflationQuest(BaseModel):
    id: str
    title: str
    title_bm: str
    description: str
    category: SpendingCategory
    target_rm: float
    current_rm: float
    xp_reward: int
    badge_name: str
    badge_emoji: str
    difficulty: Literal["easy", "medium", "hard", "legendary"]
    active: bool
    completed: bool
    progress_pct: float


class SentinelDashboardResponse(BaseModel):
    spending_snapshots: list[SpendingSnapshot]
    risk_profile: RiskProfile
    active_event: MacroEvent | None
    quests: list[InflationQuest]
    total_monthly_spend_rm: float
    sentinel_heat: float
    market_mood: str


class SimulateEventRequest(BaseModel):
    event_type: MacroEventType


class SimulateEventResponse(BaseModel):
    impact: MacroImpactResult
    quests_generated: list[InflationQuest]
    xp_awarded: int
