from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import TypedDict

from app.core.database import get_supabase
from app.schemas.sentinel import (
    CategoryImpact,
    InflationQuest,
    MacroEvent,
    MacroImpactResult,
    RiskLabel,
    RiskProfile,
    SentinelDashboardResponse,
    SimulateEventResponse,
    SpendingSnapshot,
)
from app.services import gamification_service

logger = logging.getLogger(__name__)

MOCK_TRANSACTIONS = [
    {"id": "t01", "merchant": "Mydin", "merchant_tag": "mydin", "category": "groceries", "amount": 45.0, "date": "2026-05-01"},
    {"id": "t02", "merchant": "Mydin", "merchant_tag": "mydin", "category": "groceries", "amount": 67.0, "date": "2026-05-08"},
    {"id": "t03", "merchant": "Lotus's", "merchant_tag": "lotusc", "category": "groceries", "amount": 89.0, "date": "2026-05-03"},
    {"id": "t04", "merchant": "NSK", "merchant_tag": "nsk", "category": "groceries", "amount": 34.0, "date": "2026-05-10"},
    {"id": "t05", "merchant": "Tesco", "merchant_tag": "tesco", "category": "groceries", "amount": 112.0, "date": "2026-05-05"},
    {"id": "t06", "merchant": "Jaya Grocer", "merchant_tag": "jaya_grocer", "category": "groceries", "amount": 78.0, "date": "2026-05-12"},
    {"id": "t07", "merchant": "Petronas", "merchant_tag": "petronas", "category": "fuel", "amount": 80.0, "date": "2026-05-02"},
    {"id": "t08", "merchant": "Petronas", "merchant_tag": "petronas", "category": "fuel", "amount": 65.0, "date": "2026-05-09"},
    {"id": "t09", "merchant": "Shell", "merchant_tag": "shell", "category": "fuel", "amount": 90.0, "date": "2026-05-06"},
    {"id": "t10", "merchant": "Caltex", "merchant_tag": "caltex", "category": "fuel", "amount": 55.0, "date": "2026-05-13"},
    {"id": "t11", "merchant": "GrabFood", "merchant_tag": "grabfood", "category": "food_delivery", "amount": 28.0, "date": "2026-05-01"},
    {"id": "t12", "merchant": "GrabFood", "merchant_tag": "grabfood", "category": "food_delivery", "amount": 35.0, "date": "2026-05-04"},
    {"id": "t13", "merchant": "GrabFood", "merchant_tag": "grabfood", "category": "food_delivery", "amount": 22.0, "date": "2026-05-07"},
    {"id": "t14", "merchant": "GrabFood", "merchant_tag": "grabfood", "category": "food_delivery", "amount": 45.0, "date": "2026-05-11"},
    {"id": "t15", "merchant": "GrabFood", "merchant_tag": "grabfood", "category": "food_delivery", "amount": 18.0, "date": "2026-05-14"},
    {"id": "t16", "merchant": "Foodpanda", "merchant_tag": "foodpanda", "category": "food_delivery", "amount": 32.0, "date": "2026-05-03"},
    {"id": "t17", "merchant": "Foodpanda", "merchant_tag": "foodpanda", "category": "food_delivery", "amount": 27.0, "date": "2026-05-08"},
    {"id": "t18", "merchant": "Foodpanda", "merchant_tag": "foodpanda", "category": "food_delivery", "amount": 41.0, "date": "2026-05-12"},
    {"id": "t19", "merchant": "Netflix", "merchant_tag": "netflix", "category": "entertainment", "amount": 55.0, "date": "2026-05-01"},
    {"id": "t20", "merchant": "Spotify", "merchant_tag": "spotify", "category": "entertainment", "amount": 17.0, "date": "2026-05-01"},
    {"id": "t21", "merchant": "Astro", "merchant_tag": "astro", "category": "entertainment", "amount": 89.0, "date": "2026-05-01"},
    {"id": "t22", "merchant": "Grab", "merchant_tag": "grab", "category": "transport", "amount": 25.0, "date": "2026-05-02"},
    {"id": "t23", "merchant": "Grab", "merchant_tag": "grab", "category": "transport", "amount": 18.0, "date": "2026-05-06"},
    {"id": "t24", "merchant": "Grab", "merchant_tag": "grab", "category": "transport", "amount": 32.0, "date": "2026-05-10"},
    {"id": "t25", "merchant": "TNB", "merchant_tag": "astro", "category": "utilities", "amount": 145.0, "date": "2026-05-05"},
    {"id": "t26", "merchant": "Air Selangor", "merchant_tag": "myrapid", "category": "utilities", "amount": 28.0, "date": "2026-05-05"},
]

EVENT_CATALOG: dict[str, dict] = {
    "grain_spike": {
        "title": "Global Grain Price Spike",
        "title_bm": "Harga Bijirin Global Melonjak",
        "icon": "🌾",
        "description": "Global wheat and rice futures up 23%",
        "severity": 72.0,
    },
    "fuel_subsidy_cut": {
        "title": "Fuel Subsidy Rationalisation",
        "title_bm": "Rasionalisasi Subsidi Bahan Api",
        "icon": "⛽",
        "description": "RON95 targeted subsidy adjustment",
        "severity": 85.0,
    },
    "logistics_surge": {
        "title": "Logistics Cost Surge",
        "title_bm": "Kos Logistik Meningkat",
        "icon": "🚛",
        "description": "Port congestion drives freight costs +18%",
        "severity": 58.0,
    },
    "currency_depreciation": {
        "title": "Ringgit Under Pressure",
        "title_bm": "Ringgit Tertekan",
        "icon": "💸",
        "description": "MYR weakens against USD amid global uncertainty",
        "severity": 65.0,
    },
    "electricity_tariff": {
        "title": "Electricity Tariff Revision",
        "title_bm": "Semakan Tarif Elektrik",
        "icon": "⚡",
        "description": "TNB revises commercial and residential tariffs",
        "severity": 60.0,
    },
    "palm_oil_shock": {
        "title": "Palm Oil Price Shock",
        "title_bm": "Kejutan Harga Minyak Sawit",
        "icon": "🌴",
        "description": "CPO futures volatile amid export restrictions",
        "severity": 55.0,
    },
}

IMPACT_RATES: dict[str, dict[str, float]] = {
    "grain_spike": {"groceries": 0.18, "food_delivery": 0.12},
    "fuel_subsidy_cut": {"fuel": 0.30, "transport": 0.15, "food_delivery": 0.08},
    "logistics_surge": {"groceries": 0.10, "food_delivery": 0.15},
    "currency_depreciation": {"groceries": 0.08, "entertainment": 0.12, "utilities": 0.10},
    "electricity_tariff": {"utilities": 0.25, "groceries": 0.05},
    "palm_oil_shock": {"groceries": 0.14, "food_delivery": 0.10},
}

SENSITIVITY_WEIGHTS: dict[str, dict[str, float]] = {
    "grain_spike": {"groceries": 90.0, "food_delivery": 70.0},
    "fuel_subsidy_cut": {"fuel": 95.0, "transport": 75.0, "food_delivery": 50.0},
    "logistics_surge": {"groceries": 65.0, "food_delivery": 80.0},
    "currency_depreciation": {"groceries": 55.0, "entertainment": 70.0, "utilities": 60.0},
    "electricity_tariff": {"utilities": 85.0, "groceries": 40.0},
    "palm_oil_shock": {"groceries": 80.0, "food_delivery": 65.0},
}

GROCERY_TAGS = {"mydin", "lotusc", "nsk", "tesco", "jaya_grocer"}

AFFECTED_MERCHANTS: dict[str, dict[str, list[str]]] = {
    "grain_spike": {"groceries": ["Mydin", "Lotus's", "NSK", "Tesco"], "food_delivery": ["GrabFood", "Foodpanda"]},
    "fuel_subsidy_cut": {"fuel": ["Petronas", "Shell", "Caltex"], "transport": ["Grab"], "food_delivery": ["GrabFood", "Foodpanda"]},
    "logistics_surge": {"groceries": ["Mydin", "Tesco", "Lotus's"], "food_delivery": ["GrabFood", "Foodpanda"]},
    "currency_depreciation": {"groceries": ["Jaya Grocer", "Tesco"], "entertainment": ["Netflix", "Spotify"], "utilities": ["TNB"]},
    "electricity_tariff": {"utilities": ["TNB", "Air Selangor"], "groceries": ["Mydin", "NSK"]},
    "palm_oil_shock": {"groceries": ["Mydin", "NSK", "Lotus's"], "food_delivery": ["GrabFood", "Foodpanda"]},
}


class SentinelState(TypedDict):
    active_event: dict | None
    quests: list[dict]
    event_history: list[dict]


_sentinel_store: dict[str, SentinelState] = {}


def _get_state(user_id: str) -> SentinelState:
    if user_id not in _sentinel_store:
        _sentinel_store[user_id] = {"active_event": None, "quests": [], "event_history": []}
    return _sentinel_store[user_id]


def _compute_spending_snapshots(active_event_type: str | None) -> list[SpendingSnapshot]:
    category_totals: dict[str, float] = {}
    category_counts: dict[str, int] = {}
    category_merchants: dict[str, dict[str, float]] = {}

    for tx in MOCK_TRANSACTIONS:
        cat = tx["category"]
        amt = tx["amount"]
        merchant = tx["merchant"]
        category_totals[cat] = category_totals.get(cat, 0.0) + amt
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if cat not in category_merchants:
            category_merchants[cat] = {}
        category_merchants[cat][merchant] = category_merchants[cat].get(merchant, 0.0) + amt

    grand_total = sum(category_totals.values())
    sensitivity_map = SENSITIVITY_WEIGHTS.get(active_event_type or "", {}) if active_event_type else {}

    snapshots: list[SpendingSnapshot] = []
    for cat, total in category_totals.items():
        top_merchant = max(category_merchants[cat], key=lambda m: category_merchants[cat][m])
        pct = round((total / grand_total) * 100, 1) if grand_total > 0 else 0.0
        sensitivity = sensitivity_map.get(cat, 10.0)
        snapshots.append(
            SpendingSnapshot(
                category=cat,  # type: ignore[arg-type]
                total_rm=round(total, 2),
                pct_of_spend=pct,
                transaction_count=category_counts[cat],
                top_merchant=top_merchant,
                sensitivity_score=sensitivity,
            )
        )

    return sorted(snapshots, key=lambda s: s.total_rm, reverse=True)


def _compute_risk_profile(snapshots: list[SpendingSnapshot]) -> RiskProfile:
    cat_map = {s.category: s for s in snapshots}
    labels: list[RiskLabel] = []

    grocery_snap = cat_map.get("groceries")
    fuel_snap = cat_map.get("fuel")
    food_snap = cat_map.get("food_delivery")

    grocery_pct = grocery_snap.pct_of_spend if grocery_snap else 0.0
    fuel_pct = fuel_snap.pct_of_spend if fuel_snap else 0.0
    food_pct = food_snap.pct_of_spend if food_snap else 0.0

    grocery_tags_used = {tx["merchant_tag"] for tx in MOCK_TRANSACTIONS if tx["category"] == "groceries"}
    grocery_heavy = grocery_pct > 30 or bool(grocery_tags_used & GROCERY_TAGS)

    if grocery_heavy:
        labels.append("Grocery-Sensitive")
    if fuel_pct > 20:
        labels.append("Fuel-Sensitive")
    if food_pct > 15:
        labels.append("Food-Delivery Dependent")
    if (grocery_pct + fuel_pct) > 50:
        labels.append("Vulnerable Consumer")

    primary: RiskLabel = labels[0] if labels else "Resilient Saver"
    secondary: list[RiskLabel] = [lbl for lbl in labels[1:] if lbl != primary]

    sensitive_sum = (grocery_pct * 1.2) + (fuel_pct * 1.3) + (food_pct * 1.0)
    vulnerability_score = min(round(sensitive_sum * 1.5, 1), 100.0)

    most_exposed = max(snapshots, key=lambda s: s.total_rm)

    top_risk_merchants: list[str] = []
    for tx in MOCK_TRANSACTIONS:
        if tx["merchant_tag"] in GROCERY_TAGS or tx["category"] in ("fuel", "food_delivery"):
            if tx["merchant"] not in top_risk_merchants:
                top_risk_merchants.append(tx["merchant"])
        if len(top_risk_merchants) >= 5:
            break

    return RiskProfile(
        primary_label=primary,
        secondary_labels=secondary,
        vulnerability_score=vulnerability_score,
        most_exposed_category=most_exposed.category,
        top_risk_merchants=top_risk_merchants,
    )


def _severity_label(severity: float) -> str:
    if severity >= 80:
        return "Critical"
    if severity >= 65:
        return "Severe"
    if severity >= 45:
        return "Moderate"
    return "Mild"


def _compute_impact(event_type: str, snapshots: list[SpendingSnapshot]) -> tuple[list[CategoryImpact], float]:
    rates = IMPACT_RATES.get(event_type, {})
    merchants_map = AFFECTED_MERCHANTS.get(event_type, {})
    cat_map = {s.category: s for s in snapshots}
    impacts: list[CategoryImpact] = []
    total_impact = 0.0

    for cat, rate in rates.items():
        snap = cat_map.get(cat)  # type: ignore[arg-type]
        if snap is None:
            continue
        increase_rm = round(snap.total_rm * rate, 2)
        increase_pct = round(rate * 100, 1)
        total_impact += increase_rm
        impacts.append(
            CategoryImpact(
                category=cat,  # type: ignore[arg-type]
                estimated_increase_rm=increase_rm,
                estimated_increase_pct=increase_pct,
                affected_merchants=merchants_map.get(cat, []),
            )
        )

    return impacts, round(total_impact, 2)


def _generate_intervention(
    event_type: str,
    impact_rm: float,
    risk_profile: RiskProfile,
    severity: float,
) -> dict:
    impact_str = f"RM{impact_rm:.0f}"
    sev_label = _severity_label(severity)

    interventions: dict[str, dict] = {
        "grain_spike": {
            "ai_intervention_title": "Global Grain Prices Are Spiking — Your Basket Is at Risk",
            "ai_intervention_bm": "Harga Bijirin Global Naik! Bajet Groceri Anda Terjejas 🌾",
            "ai_intervention_body": (
                f"Eh bro, global grain price terkejut naik! 🌾🚨 "
                f"Your Mydin basket might cost ~{impact_str} more this month. "
                f"Jangan panic buy — that's exactly what they want! "
                f"Switch to locally-sourced alternatives & check NSK for better deals. "
                f"Tahan dulu, situasi ni temporary. 💪"
            ),
            "persona_emoji": "🧑‍🍳",
            "persona_name": "Pak Cik Kedai",
        },
        "fuel_subsidy_cut": {
            "ai_intervention_title": "Fuel Subsidy Cut Alert — Your Transport Costs Are Rising",
            "ai_intervention_bm": "Subsidi Minyak Dipotong! Kos Perjalanan Anda Akan Naik ⛽",
            "ai_intervention_body": (
                f"Adoi! Kerajaan adjust fuel subsidy semula 😤 "
                f"Expect pump price to spike. Your monthly fuel spend could jump ~{impact_str}. "
                f"Time to carpool dengan jiran! Or maybe test drive that EV you've been eyeing 👀. "
                f"Grab carpooling > solo drives for a while. Jimat la sikit!"
            ),
            "persona_emoji": "⛽",
            "persona_name": "Uncle Shell",
        },
        "logistics_surge": {
            "ai_intervention_title": "Supply Chain Disruption — Prices Creeping Up Everywhere",
            "ai_intervention_bm": "Kos Logistik Melonjak! Harga Barang Naik Merata 🚛",
            "ai_intervention_body": (
                f"Supply chain drama lagi! 📦 "
                f"Everything from Grab to your local kedai runcit feeling the heat. "
                f"Your monthly spend could increase ~{impact_str}. "
                f"Pro tip: bulk buy non-perishables NOW before prices fully adjust. "
                f"Tesco & Lotus's warehouse section is your best friend this week!"
            ),
            "persona_emoji": "🚛",
            "persona_name": "Abang Logistic",
        },
        "currency_depreciation": {
            "ai_intervention_title": "Ringgit Weakening — Imported Goods Getting Pricier",
            "ai_intervention_bm": "Ringgit Melemah! Barang Import Makin Mahal 💸",
            "ai_intervention_body": (
                f"Ringgit tgh lemah sikit... 😬 "
                f"Imported goods getting pricier. Your Netflix & Spotify bills might sneak up on you! "
                f"Monthly impact could be ~{impact_str}. "
                f"Time to audit those subscriptions — do you REALLY need 3 streaming services? 👀 "
                f"Local alternatives wujud tau. Support local, jimat duit!"
            ),
            "persona_emoji": "💸",
            "persona_name": "Auntie Ringgit",
        },
        "electricity_tariff": {
            "ai_intervention_title": "TNB Tariff Rising — Your Utilities Bill Is About to Hurt",
            "ai_intervention_bm": "Tarif Elektrik TNB Naik! Bil Utiliti Anda Akan Meningkat ⚡",
            "ai_intervention_body": (
                f"TNB tariff adjustment incoming! ⚡😱 "
                f"Your monthly utilities could jump ~{impact_str}. "
                f"Aircond warriors, this is your villain origin story... "
                f"Set timer on your aircond, switch to LED bulbs kalau belum lagi. "
                f"Small changes = big savings when tariff hits. Jom jimat elektrik!"
            ),
            "persona_emoji": "⚡",
            "persona_name": "Pak TNB",
        },
        "palm_oil_shock": {
            "ai_intervention_title": "Palm Oil Prices Volatile — Food Costs Creeping Up",
            "ai_intervention_bm": "Harga Minyak Sawit Bergolak! Kos Makanan Makin Tinggi 🌴",
            "ai_intervention_body": (
                f"Palm oil prices volatile gila! 🌴😤 "
                f"Your mee goreng & kuih-muih ingredients getting expensive. "
                f"Budget mamak run might hurt ~{impact_str} more this month. "
                f"Cook at home more lah — Pak Cik Kedai kata barang masak sendiri still cheaper. "
                f"Jom masak, jom jimat! 🍳"
            ),
            "persona_emoji": "🌴",
            "persona_name": "Mak Cik CPO",
        },
    }

    result = interventions.get(event_type, {
        "ai_intervention_title": "Macro Alert — Your Spending May Be Affected",
        "ai_intervention_bm": "Amaran Makro — Perbelanjaan Anda Mungkin Terjejas",
        "ai_intervention_body": f"Market conditions shifting. Estimated impact: ~{impact_str}. Stay alert!",
        "persona_emoji": "📊",
        "persona_name": "The Sentinel",
    })
    result["severity_label"] = sev_label
    return result


def _generate_quests(event_type: str, snapshots: list[SpendingSnapshot], severity: float) -> list[InflationQuest]:
    cat_map = {s.category: s for s in snapshots}
    rates = IMPACT_RATES.get(event_type, {})
    primary_cat = next(iter(rates), "groceries")
    snap = cat_map.get(primary_cat)  # type: ignore[arg-type]
    current_rm = snap.total_rm if snap else 100.0

    scale = max(0.5, severity / 100)

    quests: list[InflationQuest] = [
        InflationQuest(
            id=f"{event_type}_easy",
            title=f"Trim Your {primary_cat.replace('_', ' ').title()} Spend",
            title_bm=f"Kurangkan Belanja {primary_cat.replace('_', ' ').title()}",
            description=f"Spend less than 80% of your usual {primary_cat.replace('_', ' ')} budget this month.",
            category=primary_cat,  # type: ignore[arg-type]
            target_rm=round(current_rm * 0.80, 2),
            current_rm=round(current_rm, 2),
            xp_reward=int(50 * scale),
            badge_name="Jimat Hero",
            badge_emoji="🛡️",
            difficulty="easy",
            active=True,
            completed=False,
            progress_pct=0.0,
        ),
        InflationQuest(
            id=f"{event_type}_medium",
            title=f"Cut {primary_cat.replace('_', ' ').title()} to 65%",
            title_bm=f"Potong {primary_cat.replace('_', ' ').title()} ke 65%",
            description=f"Spend less than 65% of your usual {primary_cat.replace('_', ' ')} budget — serious jimat mode!",
            category=primary_cat,  # type: ignore[arg-type]
            target_rm=round(current_rm * 0.65, 2),
            current_rm=round(current_rm, 2),
            xp_reward=int(100 * scale),
            badge_name="Inflasi Slayer",
            badge_emoji="⚔️",
            difficulty="medium",
            active=True,
            completed=False,
            progress_pct=0.0,
        ),
        InflationQuest(
            id=f"{event_type}_hard",
            title="3-Day No Food Delivery Streak",
            title_bm="Streak 3 Hari Tanpa Food Delivery",
            description="Maintain a 3-day streak of zero food delivery orders. Cook at home, jom!",
            category="food_delivery",
            target_rm=0.0,
            current_rm=round(cat_map.get("food_delivery", snapshots[0]).total_rm, 2) if cat_map.get("food_delivery") else 0.0,
            xp_reward=int(150 * scale),
            badge_name="Tahan Nafsu",
            badge_emoji="💎",
            difficulty="hard",
            active=True,
            completed=False,
            progress_pct=0.0,
        ),
    ]
    return quests


def _market_mood(sentinel_heat: float) -> str:
    if sentinel_heat >= 75:
        return "Crisis"
    if sentinel_heat >= 55:
        return "Alert"
    if sentinel_heat >= 35:
        return "Cautious"
    return "Calm"


def _fetch_latest_detected_event() -> MacroEvent | None:
    """Most recent auto-detected event from sentinel_macro_events (news_rss +
    macro_event_classifier), used when the user hasn't manually simulated one.

    Tolerates no Supabase, an unapplied migration, or an empty table — all
    just mean "nothing detected yet", never an error surfaced to the user.
    """
    supabase = get_supabase()
    if supabase is None:
        return None
    try:
        res = (
            supabase.table("sentinel_macro_events")
            .select("event_type, title, title_bm, severity, description, icon, triggered_at")
            .order("triggered_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        logger.warning("Failed to fetch latest detected macro event: %s", e)
        return None

    if not hasattr(res, "data") or not res.data:
        return None
    row = res.data
    try:
        return MacroEvent(
            event_type=row["event_type"],
            title=row["title"],
            title_bm=row.get("title_bm") or row["title"],
            severity=float(row.get("severity") or 0.0),
            description=row.get("description") or row["title"],
            icon=row.get("icon") or "📰",
            triggered_at=row["triggered_at"],
        )
    except Exception as e:
        logger.warning("Malformed macro event row, skipping: %s", e)
        return None


async def get_dashboard(user_id: str) -> SentinelDashboardResponse:
    state = _get_state(user_id)
    active_event_type: str | None = None
    active_event: MacroEvent | None = None

    if state["active_event"]:
        ev = state["active_event"]
        active_event_type = ev["event_type"]
        active_event = MacroEvent(**ev)
    else:
        active_event = _fetch_latest_detected_event()
        if active_event:
            active_event_type = active_event.event_type

    snapshots = _compute_spending_snapshots(active_event_type)
    risk_profile = _compute_risk_profile(snapshots)

    sentinel_heat = risk_profile.vulnerability_score
    if active_event:
        sentinel_heat = min(100.0, sentinel_heat + active_event.severity * 0.3)

    quests = [InflationQuest(**q) for q in state["quests"]]

    return SentinelDashboardResponse(
        spending_snapshots=snapshots,
        risk_profile=risk_profile,
        active_event=active_event,
        quests=quests,
        total_monthly_spend_rm=round(sum(s.total_rm for s in snapshots), 2),
        sentinel_heat=round(sentinel_heat, 1),
        market_mood=_market_mood(sentinel_heat),
    )


async def simulate_event(user_id: str, event_type: str) -> SimulateEventResponse:
    state = _get_state(user_id)
    catalog = EVENT_CATALOG[event_type]
    now_iso = datetime.now(timezone.utc).isoformat()

    event = MacroEvent(
        event_type=event_type,  # type: ignore[arg-type]
        title=catalog["title"],
        title_bm=catalog["title_bm"],
        severity=catalog["severity"],
        description=catalog["description"],
        icon=catalog["icon"],
        triggered_at=now_iso,
    )
    state["active_event"] = event.model_dump()

    snapshots = _compute_spending_snapshots(event_type)
    risk_profile = _compute_risk_profile(snapshots)
    category_impacts, total_impact_rm = _compute_impact(event_type, snapshots)
    intervention = _generate_intervention(event_type, total_impact_rm, risk_profile, catalog["severity"])
    quests = _generate_quests(event_type, snapshots, catalog["severity"])
    # Merge: replace quests of same event_type, keep quests from other events
    existing_quests = state.get("quests", [])
    new_ids = {q.id for q in quests}
    kept = [q for q in existing_quests if q["id"] not in new_ids]
    state["quests"] = kept + [q.model_dump() for q in quests]

    if state["active_event"] not in state["event_history"]:
        state["event_history"].append(state["active_event"])

    xp_awarded = int(catalog["severity"] / 10)
    gamification_service.award_xp(user_id, xp_awarded)

    impact = MacroImpactResult(
        event=event,
        total_monthly_impact_rm=total_impact_rm,
        category_impacts=category_impacts,
        ai_intervention_title=intervention["ai_intervention_title"],
        ai_intervention_bm=intervention["ai_intervention_bm"],
        ai_intervention_body=intervention["ai_intervention_body"],
        persona_emoji=intervention["persona_emoji"],
        persona_name=intervention["persona_name"],
        severity_label=intervention["severity_label"],
    )

    return SimulateEventResponse(impact=impact, quests_generated=quests, xp_awarded=xp_awarded)


async def get_quests(user_id: str) -> list[InflationQuest]:
    state = _get_state(user_id)
    return [InflationQuest(**q) for q in state["quests"]]


async def complete_quest(user_id: str, quest_id: str) -> dict:
    state = _get_state(user_id)
    for q in state["quests"]:
        if q["id"] == quest_id:
            if q["completed"]:
                return {"success": False, "message": "Quest already completed", "xp_awarded": 0}
            q["completed"] = True
            q["active"] = False
            q["progress_pct"] = 100.0
            xp = q["xp_reward"]
            gamification_service.award_xp(user_id, xp)
            return {"success": True, "message": f"Quest '{q['title']}' completed!", "xp_awarded": xp}
    return {"success": False, "message": "Quest not found", "xp_awarded": 0}


# ── Agent 5: Commodity Scanner ──────────────────────────────────────────

COMMODITY_CATALOG = [
    {
        "id": "eggs", "name": "Eggs (10pcs)", "symbol": "$EGGS", "emoji": "🥚", "category": "groceries",
        "currentPrice": "RM6.80–RM7.50", "trend": "up", "changePct": 18.5,
        "newsHeadline": "Malaysia egg prices surge as feed costs rise 22% due to global grain shortage",
        "newsSource": "The Edge Markets",
        "predictedImpactRm": 12.50,
        "lastUpdated": "3 hours ago",
        "sparkline": [10, 12, 11, 15, 14, 18, 20],
    },
    {
        "id": "rice", "name": "Rice (10kg)", "symbol": "$RICE", "emoji": "🍚", "category": "groceries",
        "currentPrice": "RM28–RM35", "trend": "up", "changePct": 8.2,
        "newsHeadline": "India rice export ban continues to pressure ASEAN markets; local prices up 8%",
        "newsSource": "Bernama",
        "predictedImpactRm": 15.00,
        "lastUpdated": "6 hours ago",
        "sparkline": [20, 21, 20, 22, 23, 22, 24],
    },
    {
        "id": "cooking_oil", "name": "Cooking Oil (5kg)", "symbol": "$CPO", "emoji": "🫒", "category": "groceries",
        "currentPrice": "RM27.50–RM32", "trend": "up", "changePct": 12.0,
        "newsHeadline": "Palm oil futures hit 3-month high on biodiesel demand and lower output",
        "newsSource": "Reuters",
        "predictedImpactRm": 8.20,
        "lastUpdated": "5 hours ago",
        "sparkline": [15, 14, 16, 17, 19, 18, 20],
    },
    {
        "id": "chicken", "name": "Chicken (per kg)", "symbol": "$CHKN", "emoji": "🍗", "category": "groceries",
        "currentPrice": "RM9.50–RM10.80", "trend": "flat", "changePct": 1.2,
        "newsHeadline": "Chicken prices stable after government extends price control scheme to December",
        "newsSource": "Malay Mail",
        "predictedImpactRm": 2.00,
        "lastUpdated": "1 day ago",
        "sparkline": [10, 10, 11, 10, 10, 11, 11],
    },
    {
        "id": "ron95", "name": "RON95 Petrol", "symbol": "$RON95", "emoji": "⛽", "category": "fuel",
        "currentPrice": "RM2.05/L", "trend": "down", "changePct": -5.0,
        "newsHeadline": "Global crude oil dips below $75/barrel; Malaysia may see further pump price reduction",
        "newsSource": "Free Malaysia Today",
        "predictedImpactRm": -8.50,
        "lastUpdated": "2 hours ago",
        "sparkline": [30, 28, 29, 27, 26, 25, 24],
    },
    {
        "id": "diesel", "name": "Diesel", "symbol": "$DSL", "emoji": "🚛", "category": "fuel",
        "currentPrice": "RM2.15/L", "trend": "down", "changePct": -3.5,
        "newsHeadline": "BUDI95 subsidy restructuring lowers diesel burden for commercial users",
        "newsSource": "The Star",
        "predictedImpactRm": -5.00,
        "lastUpdated": "4 hours ago",
        "sparkline": [25, 24, 25, 23, 22, 22, 21],
    },
]


def _fetch_live_commodity_overrides() -> dict[str, dict]:
    """Latest live-ingested price per symbol (data.gov.my fuel, BNM FX), keyed to
    match COMMODITY_CATALOG's `symbol` field (e.g. "$RON95" -> "RON95").

    Falls back to an empty dict — meaning every symbol stays on its mocked
    catalog entry — if Supabase isn't configured, the migration hasn't been
    applied yet, or the ingestion job hasn't run yet.
    """
    supabase = get_supabase()
    if supabase is None:
        return {}
    try:
        res = (
            supabase.table("sentinel_commodity_prices")
            .select("symbol, current_price_display, trend, change_pct, news_headline, news_source, fetched_at")
            .order("price_date", desc=True)
            .limit(50)
            .execute()
        )
    except Exception as e:
        logger.warning("Failed to fetch live commodity overrides (migration may not be applied yet): %s", e)
        return {}

    rows = res.data if hasattr(res, "data") and res.data else []
    overrides: dict[str, dict] = {}
    for row in rows:
        symbol = row.get("symbol")
        if symbol and symbol not in overrides:
            overrides[symbol] = row
    return overrides


def _humanize_fetched_at(fetched_at: str | None) -> str | None:
    if not fetched_at:
        return None
    try:
        fetched = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
    except ValueError:
        return None
    delta = datetime.now(timezone.utc) - fetched
    hours = delta.total_seconds() / 3600
    if hours < 1:
        return "just now"
    if hours < 24:
        return f"{int(hours)} hours ago"
    return f"{int(hours // 24)} days ago"


async def scan_commodities(user_id: str) -> dict:
    """Agent 5 steps:
    1. Check user's recent transactions for affected categories
    2. Correlate with current market news/price data
    3. Return commodity cards with personalized predictions
    """
    # Step 1: Analyze user's transaction categories
    user_categories: set[str] = set()
    category_merchants: dict[str, list[str]] = {}
    for tx in MOCK_TRANSACTIONS:
        cat = tx["category"]
        user_categories.add(cat)
        if cat not in category_merchants:
            category_merchants[cat] = []
        category_merchants[cat].append(f"RM{tx['amount']:.2f} at {tx['merchant']}")

    # Step 2: Filter commodities relevant to user + mark as "vulnerable" if heavy spending
    category_totals: dict[str, float] = {}
    for tx in MOCK_TRANSACTIONS:
        cat = tx["category"]
        category_totals[cat] = category_totals.get(cat, 0) + tx["amount"]

    live_overrides = _fetch_live_commodity_overrides()

    commodities = []
    total_impact = 0.0
    affected_count = 0

    for c in COMMODITY_CATALOG:
        if c["category"] not in user_categories:
            continue

        live = live_overrides.get(c["symbol"].lstrip("$"))
        merged = dict(c)
        if live:
            merged["currentPrice"] = live.get("current_price_display") or c["currentPrice"]
            merged["trend"] = live.get("trend") or c["trend"]
            merged["changePct"] = live.get("change_pct") if live.get("change_pct") is not None else c["changePct"]
            merged["newsHeadline"] = live.get("news_headline") or c["newsHeadline"]
            merged["newsSource"] = live.get("news_source") or c["newsSource"]
            merged["lastUpdated"] = _humanize_fetched_at(live.get("fetched_at")) or c["lastUpdated"]

        # Scale the predicted impact based on user's actual spending in that category
        user_spend = category_totals.get(merged["category"], 100)
        scale = min(user_spend / 200, 2.5)
        personalized_impact = round(merged["predictedImpactRm"] * scale, 2)
        total_impact += personalized_impact
        if merged["trend"] == "up":
            affected_count += 1

        # Get matched transactions for this commodity's category
        matches = category_merchants.get(merged["category"], [])[:2]

        commodities.append({
            **merged,
            "predictedImpactRm": personalized_impact,
            "matchedTransactions": matches
        })

    # Step 3: Summary
    summary = (
        f"Based on your recent spending across {len(user_categories)} categories, "
        f"{affected_count} items are trending up. "
        f"Your estimated monthly impact is +RM{total_impact:.2f}."
    ) if affected_count > 0 else (
        "Your essential items are stable this month. No major price shocks detected."
    )

    return {
        "commodities": commodities,
        "totalMonthlyImpact": round(total_impact, 2),
        "affectedCount": affected_count,
        "categoriesTracked": len(commodities),
        "summary": summary,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
    }
