"""Loot box reward service for BajetBuddy gamification."""

from __future__ import annotations

import random

from app.services.gamification_service import (
    _get_state,
    award_xp,
    get_gamification_status,
)

REWARDS = [
    {"rarity": "common",    "weight": 60, "coins": 10,  "label": "Syiling Jimat",    "emoji": "🪙"},
    {"rarity": "rare",      "weight": 25, "coins": 25,  "label": "Duit Savvy Bonus", "emoji": "💎"},
    {"rarity": "epic",      "weight": 12, "coins": 50,  "label": "Budget Warrior",   "emoji": "⚔️"},
    {"rarity": "legendary", "weight": 3,  "coins": 100, "label": "BajetBuddy Legend","emoji": "👑"},
]

_WEIGHTS = [r["weight"] for r in REWARDS]


def pull_loot_box(user_id: str) -> dict:
    """Randomly pick a reward, award XP, and update the user's coin balance."""
    reward = random.choices(REWARDS, weights=_WEIGHTS, k=1)[0]

    state = _get_state(user_id)
    state.setdefault("coins", 0)
    state["coins"] += reward["coins"]
    new_total_coins: int = state["coins"]

    award_xp(user_id, reward["coins"])
    gamification_status = get_gamification_status(user_id)

    return {
        "rarity": reward["rarity"],
        "coins": reward["coins"],
        "label": reward["label"],
        "emoji": reward["emoji"],
        "new_total_coins": new_total_coins,
        "xp_awarded": reward["coins"],
        "gamification_status": gamification_status,
    }
