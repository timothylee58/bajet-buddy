from __future__ import annotations

import json
import logging
from typing import TypedDict

import anthropic

from app.core.config import get_settings
from app.schemas.pet_companion import (
    AwardXPResponse,
    PetAccessory,
    PetMood,
    PetNudge,
    PetProfile,
    PetSpecies,
    PetStatusResponse,
)

logger = logging.getLogger(__name__)

XP_LEVELS = {1: 0, 2: 200, 3: 500, 4: 1000, 5: 2000}

XP_EVENTS: dict[str, int] = {
    "budget_under": 25,
    "goal_complete": 100,
    "walk_away": 30,
    "receipt_scan": 20,
    "streak_bonus": 15,
    "impulse_blocked": 40,
}

ACCESSORIES: list[PetAccessory] = [
    PetAccessory(id="hat_starter", name="Starter Cap", emoji="🧢", slot="hat", unlock_xp=0, description="Default cap for new companions"),
    PetAccessory(id="hat_beret", name="Savings Beret", emoji="🎩", slot="hat", unlock_xp=200, description="For the budget-conscious fashionista"),
    PetAccessory(id="hat_crown", name="Budget Crown", emoji="👑", slot="hat", unlock_xp=500, description="Royalty of the ringgit"),
    PetAccessory(id="hat_graduation", name="Finance Grad Hat", emoji="🎓", slot="hat", unlock_xp=1000, description="Masters in money management"),
    PetAccessory(id="hat_wizard", name="Duit Wizard Hat", emoji="🧙", slot="hat", unlock_xp=2000, description="Arcane knowledge of compound interest"),
    PetAccessory(id="badge_saver", name="Saver Badge", emoji="💰", slot="badge", unlock_xp=100, description="Awarded to consistent savers"),
    PetAccessory(id="badge_streak", name="Streak Badge", emoji="🔥", slot="badge", unlock_xp=400, description="Seven days of discipline"),
    PetAccessory(id="badge_legend", name="Legend Badge", emoji="⭐", slot="badge", unlock_xp=1500, description="Legendary financial discipline"),
    PetAccessory(id="trail_coins", name="Coin Trail", emoji="🪙", slot="trail", unlock_xp=150, description="Leaves a trail of coins"),
    PetAccessory(id="trail_stars", name="Star Trail", emoji="✨", slot="trail", unlock_xp=350, description="Sparkle with every step"),
    PetAccessory(id="trail_leaves", name="Eco Trail", emoji="🍃", slot="trail", unlock_xp=700, description="Green and sustainable vibes"),
    PetAccessory(id="trail_rainbow", name="Rainbow Trail", emoji="🌈", slot="trail", unlock_xp=1200, description="Because you earned it lah"),
    PetAccessory(id="aura_green", name="Emerald Aura", emoji="💚", slot="aura", unlock_xp=250, description="Radiates financial wellness"),
    PetAccessory(id="aura_gold", name="Gold Aura", emoji="🌟", slot="aura", unlock_xp=800, description="Glowing with prosperity"),
    PetAccessory(id="aura_diamond", name="Diamond Aura", emoji="💎", slot="aura", unlock_xp=1800, description="Unbreakable financial fortress"),
]

FALLBACK_NUDGES: dict[str, tuple[str, PetMood]] = {
    "dashboard_open": ("Eh, check duit dah! Good habit tau~", "happy"),
    "over_budget": ("Alamak, dah terlebih budget ni... fikir balik sikit!", "worried"),
    "under_budget": ("Wah bestnya! Still got budget lagi. Jangan habis tau!", "happy"),
    "impulse_spend": ("Tahan dulu! Kau betul-betul nak beli ke ni?", "warning"),
    "savings_goal_met": ("YASSSS! Goal tercapai! Kau memang legend bro!", "celebrating"),
    "sentinel_alert": ("Eh alert ni serious tau. Jangan ignore!", "warning"),
    "streak_milestone": ("Woooo streak baru! Keep it up champ!", "celebrating"),
}

SPECIES_NAMES: dict[str, str] = {
    "raccoon": "Rakun",
    "fox": "Foxy",
    "squirrel": "Cikgu",
    "rabbit": "Bun Bun",
    "finance_squirrel": "Prof Tupai",
}


class _PetStore(TypedDict):
    user_id: str
    species: str
    name: str
    xp: int
    level: int
    mood: str
    accessories: list[str]
    streak: int
    total_saves_rm: float
    walk_away_count: int


_store: dict[str, _PetStore] = {}


def _xp_to_level(xp: int) -> int:
    level = 1
    for lvl, threshold in sorted(XP_LEVELS.items(), reverse=True):
        if xp >= threshold:
            level = lvl
            break
    return level


def _next_level_xp(level: int) -> int:
    return XP_LEVELS.get(min(level + 1, 5), XP_LEVELS[5])


def _unlocked_accessories(xp: int) -> list[PetAccessory]:
    return [a for a in ACCESSORIES if a.unlock_xp <= xp]


def _newly_unlocked(old_xp: int, new_xp: int) -> PetAccessory | None:
    for acc in sorted(ACCESSORIES, key=lambda a: a.unlock_xp):
        if old_xp < acc.unlock_xp <= new_xp:
            return acc
    return None


def get_or_create_profile(user_id: str) -> _PetStore:
    if user_id not in _store:
        _store[user_id] = _PetStore(
            user_id=user_id,
            species="squirrel",
            name="Cikgu",
            xp=420,
            level=3,
            mood="happy",
            accessories=["hat_starter"],
            streak=7,
            total_saves_rm=0.0,
            walk_away_count=0,
        )
    return _store[user_id]


def _store_to_profile(data: _PetStore) -> PetProfile:
    return PetProfile(
        user_id=data["user_id"],
        species=data["species"],  # type: ignore[arg-type]
        name=data["name"],
        xp=data["xp"],
        level=data["level"],
        mood=data["mood"],  # type: ignore[arg-type]
        accessories=data["accessories"],
        streak=data["streak"],
        total_saves_rm=data["total_saves_rm"],
        walk_away_count=data["walk_away_count"],
    )


async def select_species(user_id: str, species: PetSpecies) -> PetProfile:
    data = get_or_create_profile(user_id)
    data["species"] = species
    data["name"] = SPECIES_NAMES.get(species, species.capitalize())
    _store[user_id] = data
    return _store_to_profile(data)


async def award_xp(user_id: str, event: str, amount_rm: float | None) -> AwardXPResponse:
    data = get_or_create_profile(user_id)
    xp_earned = XP_EVENTS.get(event, 10)
    old_xp = data["xp"]
    old_level = data["level"]

    if event == "walk_away":
        data["walk_away_count"] = data["walk_away_count"] + 1
    if event == "budget_under" and amount_rm:
        data["total_saves_rm"] = data["total_saves_rm"] + amount_rm

    new_xp = old_xp + xp_earned
    new_level = _xp_to_level(new_xp)
    data["xp"] = new_xp
    data["level"] = new_level
    _store[user_id] = data

    new_acc = _newly_unlocked(old_xp, new_xp)

    return AwardXPResponse(
        xp_earned=xp_earned,
        total_xp=new_xp,
        level=new_level,
        level_up=new_level > old_level,
        new_accessory=new_acc,
    )


def compute_mood(user_id: str, context: str, amount_rm: float | None, category: str | None) -> PetMood:  # noqa: ARG001
    data = get_or_create_profile(user_id)
    if context == "over_budget":
        return "worried"
    if context in ("savings_goal_met", "streak_milestone"):
        return "celebrating"
    if context == "impulse_spend" and amount_rm and amount_rm > 100:
        return "warning"
    if context == "sentinel_alert":
        return "warning"
    if data["streak"] == 0:
        return "sleepy"
    return "happy"


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def generate_nudge(user_id: str, context: str, amount_rm: float | None, category: str | None) -> PetNudge:
    data = get_or_create_profile(user_id)
    mood = compute_mood(user_id, context, amount_rm, category)
    species = data["species"]
    name = data["name"]

    amount_str = f"RM{amount_rm:.2f}" if amount_rm else "some amount"
    cat_str = category or "general"

    try:
        settings = get_settings()
        client = anthropic.AsyncAnthropic(
            api_key=settings.ilmu_api_key or settings.anthropic_api_key,
            base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
        )
        model = settings.ilmu_model or "claude-opus-4-5"

        system = (
            f"You are {name}, a {species} pet companion in a Malaysian budgeting app. "
            "You speak Manglish — mix of English, Malay, and Malaysian slang. "
            "You are supportive, funny, and care about your user's finances. "
            "Respond ONLY with valid JSON, no markdown fences."
        )
        user_msg = (
            f"Context: {context}. Amount: {amount_str}. Category: {cat_str}. "
            f"Current mood should be: {mood}. "
            "Return JSON: {\"message\": \"<max 120 chars Manglish speech>\", "
            "\"mood\": \"<one of happy|worried|celebrating|sleepy|warning|neutral>\", "
            "\"trigger\": \"<context>\", \"xp_hint\": <int or null>}"
        )

        response = await client.messages.create(
            model=model,
            max_tokens=200,
            messages=[{"role": "user", "content": user_msg}],
            system=system,
        )
        raw = _strip_fences(response.content[0].text)  # type: ignore[union-attr]
        parsed = json.loads(raw)
        return PetNudge(
            message=str(parsed["message"])[:120],
            mood=parsed.get("mood", mood),
            trigger=str(parsed.get("trigger", context)),
            xp_hint=parsed.get("xp_hint"),
        )
    except Exception:
        logger.warning("Claude nudge failed, using fallback for context=%s", context)
        fallback_msg, fallback_mood = FALLBACK_NUDGES.get(context, ("Jaga duit baik-baik tau!", "neutral"))
        return PetNudge(message=fallback_msg, mood=fallback_mood, trigger=context, xp_hint=None)


async def get_status(user_id: str, context: str, amount_rm: float | None, category: str | None) -> PetStatusResponse:
    data = get_or_create_profile(user_id)
    nudge = await generate_nudge(user_id, context, amount_rm, category)
    data["mood"] = nudge.mood
    _store[user_id] = data

    profile = _store_to_profile(data)
    available = _unlocked_accessories(data["xp"])
    next_xp = _next_level_xp(data["level"])
    current_threshold = XP_LEVELS.get(data["level"], 0)
    span = next_xp - current_threshold
    progress = int((data["xp"] - current_threshold) / span * 100) if span > 0 else 100

    return PetStatusResponse(
        profile=profile,
        nudge=nudge,
        available_accessories=available,
        xp_to_next_level=max(0, next_xp - data["xp"]),
        progress_pct=min(100, max(0, progress)),
    )
