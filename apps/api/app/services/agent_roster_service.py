"""Agent roster service — hardcoded AI advisor definitions with unlock logic."""

from __future__ import annotations

AGENTS: list[dict] = [
    {
        "id": "accountant",
        "name": "The Accountant",
        "emoji": "📊",
        "description": "Your default, no-nonsense financial tracker.",
        "unlock_condition": "Default — always unlocked",
        "unlock_streak": 0,
        "unlock_receipts": 0,
        "personality": "neutral",
    },
    {
        "id": "gordon_ramsay",
        "name": "Gordon Ramsay Mode",
        "emoji": "👨‍🍳",
        "description": "Brutally honest. Will roast your GrabFood habit.",
        "unlock_condition": "Maintain a 7-day logging streak",
        "unlock_streak": 7,
        "unlock_receipts": 0,
        "personality": "aggressive",
    },
    {
        "id": "kakak_kedai",
        "name": "Kakak Kedai",
        "emoji": "🏪",
        "description": "Warm, aunty-style advice. Very Malaysian.",
        "unlock_condition": "Scan 5 receipts",
        "unlock_streak": 0,
        "unlock_receipts": 5,
        "personality": "warm",
    },
    {
        "id": "crypto_bro",
        "name": "Crypto Bro",
        "emoji": "🚀",
        "description": "Hyped, speculative. Not financial advice.",
        "unlock_condition": "Reach Level 3 (500 XP)",
        "unlock_streak": 0,
        "unlock_receipts": 0,
        "unlock_xp": 500,
        "personality": "hype",
    },
    {
        "id": "financial_therapist",
        "name": "Financial Therapist",
        "emoji": "🧠",
        "description": "Gentle, empathetic. Helps you understand your money trauma.",
        "unlock_condition": "Complete all 5 onboarding questions",
        "unlock_streak": 0,
        "unlock_receipts": 0,
        "personality": "calm",
    },
]


def get_agent_roster(
    user_id: str,
    xp: int,
    streak: int,
    receipts_scanned: int = 0,
) -> list[dict]:
    """Return agents with an `unlocked` field computed from user progress."""
    result: list[dict] = []
    for agent in AGENTS:
        streak_ok = streak >= agent.get("unlock_streak", 0)
        receipts_ok = receipts_scanned >= agent.get("unlock_receipts", 0)
        xp_ok = xp >= agent.get("unlock_xp", 0)
        unlocked = streak_ok and receipts_ok and xp_ok
        result.append({**agent, "unlocked": unlocked})
    return result
