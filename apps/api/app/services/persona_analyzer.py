from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass

from app.schemas.persona import PersonaOut


@dataclass(slots=True)
class PersonaDefinition:
    name: str
    emoji: str
    description: str
    suggested_intervention_rule: str


PERSONAS: dict[str, PersonaDefinition] = {
    "midnight_shopee_queen": PersonaDefinition(
        name="Midnight Shopee Queen",
        emoji="🛍️",
        description="Impulse buys cluster late at night, especially around marketplace merchants and flash-sale behaviour.",
        suggested_intervention_rule="Push a hard wishlist delay for shopping after 10PM, especially when daily runway drops below RM40.",
    ),
    "gaji_habis_king": PersonaDefinition(
        name="Gaji Habis King",
        emoji="💸",
        description="Spending velocity spikes right after payday and leaves too little room for the rest of the month.",
        suggested_intervention_rule="Throttle non-essential spend during the first 5 salary-cycle days and surface remaining runway aggressively.",
    ),
    "bubble_tea_bro": PersonaDefinition(
        name="Bubble Tea Bro",
        emoji="🧋",
        description="Small repeated drink purchases quietly compound into a meaningful monthly drain.",
        suggested_intervention_rule="Trigger a repetition nudge after the third beverage merchant hit in 7 days.",
    ),
    "mamak_lepak_spender": PersonaDefinition(
        name="Mamak Lepak Spender",
        emoji="🍛",
        description="Social late-night mamak sessions and convenience spending cluster into recurring budget leakage.",
        suggested_intervention_rule="Warn on post-9PM dining streaks and suggest a weekly cash cap for lepak spending.",
    ),
    "bnpl_roller": PersonaDefinition(
        name="BNPL Roller",
        emoji="💳",
        description="BNPL usage has become a recurring bridge for lifestyle purchases, increasing future month pressure.",
        suggested_intervention_rule="Block discretionary purchases whenever BNPL dues are within 7 days or active BNPL count exceeds 2.",
    ),
    "grabfood_spiral": PersonaDefinition(
        name="GrabFood Spiral",
        emoji="🛵",
        description="Delivery convenience and repeated app usage are driving avoidable food spend concentration.",
        suggested_intervention_rule="Prompt a cooking or pickup alternative after repeated delivery merchant usage in the same week.",
    ),
    "bonus_burner": PersonaDefinition(
        name="Bonus Burner",
        emoji="🎉",
        description="Windfalls and bonus periods trigger outsized discretionary spending that resets savings progress.",
        suggested_intervention_rule="Hold large discretionary purchases for 48 hours after any income spike or bonus event.",
    ),
    "future_homeowner": PersonaDefinition(
        name="Future Homeowner",
        emoji="🏠",
        description="Spending is comparatively stable and savings intent is visible, with purchases weighed against long-term goals.",
        suggested_intervention_rule="Reinforce long-term savings milestones and compare discretionary spend against housing goal progress.",
    ),
    "savings_starter": PersonaDefinition(
        name="Savings Starter",
        emoji="🌱",
        description="Early budget discipline is forming, but the user still needs support to keep consistency under social and payday pressure.",
        suggested_intervention_rule="Reward check-ins and small wins, then escalate only when runway or category concentration tightens.",
    ),
}


def analyze_persona(
    *,
    transactions: list[dict],
    monthly_income: float,
    current_balance: float,
    bnpl_commitments: int,
    days_until_salary: int,
    xp: int = 420,
    streak: int = 7,
) -> dict:
    if not transactions:
        persona_key = "savings_starter"
        top_signals = ["No transaction history yet", "Defaulting to starter persona"]
        confidence = 52
        explanation = "There is not enough behaviour data yet, so the system starts with a conservative starter persona."
    else:
        category_totals: dict[str, float] = defaultdict(float)
        merchant_counts: Counter[str] = Counter()
        late_night_total = 0.0
        shopping_late_hits = 0
        beverage_hits = 0
        mamak_hits = 0
        grabfood_hits = 0
        bnpl_hits = 0
        first_five_day_spend = 0.0
        total_spend = 0.0
        income_like_hits = 0

        for tx in transactions:
            amount = float(tx["amount"])
            category = tx["category"]
            merchant = tx["merchant"].lower()
            created_at = tx["created_at"]
            bnpl = bool(tx.get("bnpl", False))
            total_spend += amount
            category_totals[category] += amount
            merchant_counts[merchant] += 1
            if bnpl:
                bnpl_hits += 1
            hour = created_at.hour
            if hour >= 22 or hour < 2:
                late_night_total += amount
                if category == "shopping":
                    shopping_late_hits += 1
            if "tealive" in merchant or "chatime" in merchant or "gong cha" in merchant:
                beverage_hits += 1
            if "mamak" in merchant or "pelita" in merchant:
                mamak_hits += 1
            if "grabfood" in merchant or "foodpanda" in merchant:
                grabfood_hits += 1
            if created_at.day <= 5:
                first_five_day_spend += amount
            if category == "income":
                income_like_hits += 1

        top_category = max(category_totals, key=category_totals.get)
        top_category_share = category_totals[top_category] / max(total_spend, 1)
        repeated_merchant, repeated_count = merchant_counts.most_common(1)[0]
        payday_velocity = first_five_day_spend / max(monthly_income, 1)
        late_night_ratio = late_night_total / max(total_spend, 1)

        scores = {
            "midnight_shopee_queen": shopping_late_hits * 34 + int(late_night_ratio * 38),
            "gaji_habis_king": int(payday_velocity * 100) + (15 if days_until_salary > 10 and current_balance < 500 else 0),
            "bubble_tea_bro": beverage_hits * 28 + (10 if repeated_count >= 3 and top_category == "food" else 0),
            "mamak_lepak_spender": mamak_hits * 28 + (10 if late_night_ratio > 0.25 else 0),
            "bnpl_roller": bnpl_hits * 18 + bnpl_commitments * 16 + (10 if top_category == "shopping" else 0),
            "grabfood_spiral": grabfood_hits * 28 + (10 if top_category == "food" and top_category_share > 0.4 else 0),
            "bonus_burner": income_like_hits * 12 + (22 if payday_velocity > 0.55 else 0),
            "future_homeowner": 62 if current_balance > 0.3 * monthly_income and top_category_share < 0.45 and bnpl_commitments == 0 else 0,
            "savings_starter": 36 if current_balance > 0.15 * monthly_income and top_category_share < 0.35 else 18,
        }

        if shopping_late_hits >= 1 and top_category == "shopping" and late_night_ratio >= 0.5:
            scores["midnight_shopee_queen"] += 24
        if current_balance >= 0.3 * monthly_income and bnpl_commitments == 0 and top_category_share <= 0.5:
            scores["future_homeowner"] += 18

        persona_key = max(scores, key=scores.get)
        confidence = max(55, min(97, scores[persona_key]))
        top_signals = [
            f"Top category: {top_category} ({top_category_share * 100:.0f}% of spend)",
            f"Repeated merchant: {repeated_merchant.title()} ({repeated_count}x)",
            f"Payday spend velocity: {payday_velocity * 100:.0f}% of income in first 5 days",
        ]
        if shopping_late_hits:
            top_signals.append(f"Late-night shopping hits: {shopping_late_hits}")
        if bnpl_hits or bnpl_commitments:
            top_signals.append(f"BNPL exposure: {bnpl_hits} flagged transactions, {bnpl_commitments} commitments")

        explanation = (
            f"This persona is driven by {top_category} concentration, merchant repetition, "
            f"and spending timing patterns that match {PERSONAS[persona_key].name.lower()}."
        )

    persona = PERSONAS[persona_key]
    level = 2 if xp < 500 else 3 if xp < 1000 else 4
    xp_to_next = 500 if level == 2 else 1000 if level == 3 else 2000

    return {
        "persona": PersonaOut(
            type=persona_key,
            name=persona.name,
            emoji=persona.emoji,
            description=persona.description,
            level=level,
            xp=xp,
            xp_to_next=xp_to_next,
            streak=streak,
            explanation=explanation,
            suggested_intervention_rule=persona.suggested_intervention_rule,
            confidence=confidence,
            top_signals=top_signals,
        )
    }
