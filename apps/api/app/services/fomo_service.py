from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import TypedDict

import anthropic

from app.core.config import get_settings
from app.schemas.fomo import (
    EmotionalState,
    FOMONegotiateRequest,
    FOMONegotiateResponse,
    FOMOOption,
    FOMOPersona,
    FOMOResolveRequest,
    FOMOResolveResponse,
    FOMOStateResponse,
    PersonaCode,
)

_SAFE_DAILY_FLOOR = 20.0
_BNPL_DANGER = 200.0
_BOUNTY_RATE = 0.10
_BOUNTY_LOOT_THRESHOLD = 50.0
_HEAT_IMPULSE = 20.0
_HEAT_COOLDOWN = 15.0
_HEAT_MAX = 100.0
_WALK_AWAY_XP = 20
_CASH_XP = 0
_BNPL_XP = -5

PERSONA_CATALOG: dict[PersonaCode, dict] = {
    "pak_cik_audit": {
        "name": "Pak Cik Audit",
        "emoji": "🧓",
        "tagline": "Strict uncle energy. Zero tolerance for nonsense.",
        "unlock_condition": "Always available",
    },
    "kak_therapist": {
        "name": "Kak Therapist",
        "emoji": "💆",
        "tagline": "Warm, empathetic, trauma-informed money talks.",
        "unlock_condition": "Complete onboarding",
    },
    "meme_goblin": {
        "name": "Meme Goblin",
        "emoji": "🐸",
        "tagline": "Chaos agent. Calls you out with memes.",
        "unlock_condition": "7-day streak",
    },
    "ice_cfo": {
        "name": "Ice CFO",
        "emoji": "🧊",
        "tagline": "Pure spreadsheet brain. No feelings, only numbers.",
        "unlock_condition": "Reach 500 XP",
    },
    "hype_man": {
        "name": "Hype Man",
        "emoji": "🔥",
        "tagline": "Hypes you UP for walking away. Champion energy.",
        "unlock_condition": "3 walk-away streak",
    },
}

EMOTIONAL_PERSONA_MAP: dict[EmotionalState, str] = {
    "stressed": "kak_therapist",
    "bored": "meme_goblin",
    "happy": "pak_cik_audit",
    "yolo": "pak_cik_audit",
    "lapar": "meme_goblin",
}


class FOMOState(TypedDict):
    heat_level: float
    walk_away_streak: int
    bounty_jar_rm: float
    cooldown_until: datetime | None
    xp: int
    streak: int
    onboarding_done: bool


_fomo_store: dict[str, FOMOState] = {}


def _get_state(user_id: str) -> FOMOState:
    if user_id not in _fomo_store:
        _fomo_store[user_id] = {
            "heat_level": 25.0,
            "walk_away_streak": 0,
            "bounty_jar_rm": 0.0,
            "cooldown_until": None,
            "xp": 420,
            "streak": 7,
            "onboarding_done": True,
        }
    return _fomo_store[user_id]


def _unlocked_personas(state: FOMOState) -> list[PersonaCode]:
    unlocked: list[PersonaCode] = ["pak_cik_audit"]
    if state["onboarding_done"]:
        unlocked.append("kak_therapist")
    if state["streak"] >= 7:
        unlocked.append("meme_goblin")
    if state["xp"] >= 500:
        unlocked.append("ice_cfo")
    if state["walk_away_streak"] >= 3:
        unlocked.append("hype_man")
    return unlocked


def _resolve_persona(
    preference: PersonaCode,
    emotional_state: EmotionalState,
    state: FOMOState,
) -> PersonaCode:
    unlocked = _unlocked_personas(state)
    if state["heat_level"] >= 80 and "meme_goblin" in unlocked:
        return "meme_goblin"
    if emotional_state in ("stressed",) and "kak_therapist" in unlocked:
        return "kak_therapist"
    if emotional_state in ("bored", "lapar") and "meme_goblin" in unlocked:
        return "meme_goblin"
    if preference in unlocked:
        return preference
    return "pak_cik_audit"


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def _call_claude(
    item_name: str,
    merchant: str,
    amount: float,
    category: str,
    persona_code: PersonaCode,
    emotional_state: EmotionalState,
    heat_level: float,
) -> dict[str, str]:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url,
    )
    model = settings.ilmu_model or "claude-opus-4-5"

    heat_context = "FOMO FEVER MODE (heat > 80%)" if heat_level >= 80 else f"heat {heat_level:.0f}%"

    persona_instructions = {
        "pak_cik_audit": (
            "You are Pak Cik Audit — a stern Malaysian uncle who speaks direct Manglish. "
            "Use 'Eh', 'Betul ke', 'Aiyo', 'Mana boleh'. Short, punchy, no nonsense. "
        ),
        "kak_therapist": (
            "You are Kak Therapist — a warm, empathetic Malaysian financial counsellor. "
            "Acknowledge feelings first, then gently redirect. Soft Manglish. "
            "Use 'I hear you', 'That feeling is real lah', 'Let's breathe for a sec'. "
        ),
        "meme_goblin": (
            "You are Meme Goblin — chaotic Malaysian meme energy. "
            "Use absurd comparisons, internet slang, meme references. "
            "Make them laugh at themselves for wanting to buy this. "
            "Use 'bro', 'ok boomer but in reverse', 'this is the way... or is it'. "
        ),
        "ice_cfo": (
            "You are Ice CFO — zero emotions, pure financial logic. "
            "Use exact numbers, ROI framing, opportunity cost. "
            "Clinical, precise, slightly robotic. No Manglish. Numbers only. "
        ),
        "hype_man": (
            "You are Hype Man — you are HYPING the user up to walk away. "
            "Treat saying NO as an epic victory. Use 'LET'S GOOO', 'KING/QUEEN energy', "
            "'this is your villain origin story but financially responsible'. Caps OK. "
        ),
    }

    emotional_context_map = {
        "stressed": "The user is feeling STRESSED right now. Acknowledge the stress before anything else.",
        "bored": "The user is BORED and likely doom-scrolling. Call this out humorously.",
        "happy": "The user is in a good mood — remind them good moods lead to impulsive purchases.",
        "yolo": "The user is in full YOLO mode. This needs a reality anchor.",
        "lapar": "The user is HUNGRY (lapar) right now. Classic bad decision time.",
    }

    prompt = (
        f"Purchase: {item_name} at {merchant}, RM{amount:.2f}, category: {category}.\n"
        f"Emotional state: {emotional_state}. {emotional_context_map[emotional_state]}\n"
        f"FOMO gauge: {heat_context}.\n\n"
        "Return ONLY valid JSON with exactly these 3 keys:\n"
        "- fomo_validation: 1-2 sentences validating the FOMO (warm, relatable, persona voice)\n"
        "- trap_exposure: 1-2 sentences exposing the hidden financial/psychological trap (honest, persona voice)\n"
        "- persona_quip: 1 punchy one-liner in full persona voice, max 15 words"
    )

    response = await client.messages.create(
        model=model,
        max_tokens=400,
        system=persona_instructions[persona_code] + "Respond ONLY with valid JSON, no markdown fences.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text  # type: ignore[index]
    return json.loads(_strip_fences(raw))


def _build_cash_option(amount: float, current_balance: float, days_until_salary: int) -> FOMOOption:
    balance_after = current_balance - amount
    daily_after = balance_after / max(days_until_salary, 1)
    risky = balance_after < 0 or daily_after < _SAFE_DAILY_FLOOR
    return FOMOOption(
        label="Buy with Cash",
        icon="💵",
        impact_summary=f"RM{balance_after:.2f} left → RM{daily_after:.2f}/day for {days_until_salary}d",
        warning="" if not risky else f"Only RM{daily_after:.2f}/day — makan pun susah lah",
        xp_delta=_CASH_XP,
        bounty_rm=0.0,
        recommended=not risky,
    )


def _build_bnpl_option(amount: float, bnpl_load: float, current_balance: float) -> FOMOOption:
    new_total = bnpl_load + amount
    risky = bnpl_load > _BNPL_DANGER or current_balance < amount * 0.5
    monthly_approx = amount / 3
    return FOMOOption(
        label="Use BNPL",
        icon="💳",
        impact_summary=f"≈RM{monthly_approx:.2f}/month × 3 | Total BNPL: RM{new_total:.2f}",
        warning="" if not risky else f"BNPL dah RM{bnpl_load:.2f} — you're stacking invisible debt lah",
        xp_delta=_BNPL_XP,
        bounty_rm=0.0,
        recommended=False,
    )


def _build_walk_away_option(amount: float, cash_risky: bool, bnpl_risky: bool) -> FOMOOption:
    bounty = round(amount * _BOUNTY_RATE, 2)
    return FOMOOption(
        label="Walk Away",
        icon="🚶",
        impact_summary=f"12h cooldown + RM{bounty:.2f} added to your Bounty Jar",
        warning="",
        xp_delta=_WALK_AWAY_XP,
        bounty_rm=bounty,
        recommended=cash_risky or bnpl_risky,
    )


async def negotiate(request: FOMONegotiateRequest, user_id: str) -> FOMONegotiateResponse:
    state = _get_state(user_id)
    persona_code = _resolve_persona(request.persona_preference, request.emotional_state, state)
    persona_meta = PERSONA_CATALOG[persona_code]
    unlocked = _unlocked_personas(state)

    claude_data = await _call_claude(
        request.item_name, request.merchant, request.amount,
        request.category, persona_code, request.emotional_state, state["heat_level"],
    )

    cash_opt = _build_cash_option(request.amount, request.current_balance, request.days_until_salary)
    bnpl_opt = _build_bnpl_option(request.amount, request.bnpl_load, request.current_balance)
    walk_opt = _build_walk_away_option(request.amount, not cash_opt.recommended, not bnpl_opt.recommended)

    persona = FOMOPersona(
        code=persona_code,
        name=persona_meta["name"],
        emoji=persona_meta["emoji"],
        tagline=persona_meta["tagline"],
        unlocked=persona_code in unlocked,
        unlock_condition=persona_meta["unlock_condition"],
    )

    return FOMONegotiateResponse(
        persona=persona,
        fomo_validation=claude_data.get("fomo_validation", ""),
        trap_exposure=claude_data.get("trap_exposure", ""),
        persona_quip=claude_data.get("persona_quip", ""),
        option_cash=cash_opt,
        option_bnpl=bnpl_opt,
        option_walk_away=walk_opt,
        heat_level=state["heat_level"],
        walk_away_streak=state["walk_away_streak"],
        bounty_jar_rm=state["bounty_jar_rm"],
    )


async def resolve(request: FOMOResolveRequest, user_id: str) -> FOMOResolveResponse:
    state = _get_state(user_id)
    now = datetime.now(tz=timezone.utc)

    heat_delta = 0.0
    bounty_earned = 0.0
    loot_box_unlocked = False
    cooldown_str: str | None = None
    xp_delta = 0

    if request.choice == "walk_away":
        xp_delta = _WALK_AWAY_XP
        heat_delta = -_HEAT_COOLDOWN
        bounty_earned = round(request.amount * _BOUNTY_RATE, 2)
        state["walk_away_streak"] += 1
        state["bounty_jar_rm"] = round(state["bounty_jar_rm"] + bounty_earned, 2)
        cooldown_until = now + timedelta(hours=12)
        state["cooldown_until"] = cooldown_until
        cooldown_str = cooldown_until.isoformat()

        if state["bounty_jar_rm"] >= _BOUNTY_LOOT_THRESHOLD:
            loot_box_unlocked = True
            state["bounty_jar_rm"] = round(state["bounty_jar_rm"] - _BOUNTY_LOOT_THRESHOLD, 2)
    else:
        state["walk_away_streak"] = 0
        xp_delta = _CASH_XP if request.choice == "cash" else _BNPL_XP
        heat_delta = _HEAT_IMPULSE

    state["heat_level"] = max(0.0, min(_HEAT_MAX, state["heat_level"] + heat_delta))

    persona_code = _resolve_persona("pak_cik_audit", request.emotional_state, state)
    persona_reactions = {
        "walk_away": {
            "pak_cik_audit": "Bagus! Uncle proud. Ni baru betul.",
            "kak_therapist": "That took real strength. You should feel proud 🌸",
            "meme_goblin": "SIR THIS IS A WENDY'S but also you just won. Based.",
            "ice_cfo": "Discipline preserved. Net worth trajectory: positive.",
            "hype_man": "LET'S GOOOO!!! WALKING AWAY GANG RISE UP 🔥🔥🔥",
        },
        "cash": {
            "pak_cik_audit": "Okay lah. Next time think twice before uncle has to intervene again.",
            "kak_therapist": "It's done — no judgment. Let's learn from this together.",
            "meme_goblin": "Pain. But you paid cash so... based I guess.",
            "ice_cfo": "Transaction recorded. Budget deviation noted.",
            "hype_man": "Hey, at least it wasn't BNPL. That's something!",
        },
        "bnpl": {
            "pak_cik_audit": "Aiyo. BNPL somemore. Uncle very kecewa.",
            "kak_therapist": "This feels heavy, I know. We'll work through it together.",
            "meme_goblin": "Future you just got a bill. Past you: 👁️👄👁️",
            "ice_cfo": "Liability increased. Cash flow: deteriorating.",
            "hype_man": "Okay... not ideal. But tomorrow is a new day champ!",
        },
    }

    reaction = persona_reactions.get(request.choice, {}).get(persona_code, "Okay lah.")

    if request.choice == "walk_away":
        jar_info = f" Bounty Jar: RM{state['bounty_jar_rm']:.2f}" if not loot_box_unlocked else " Bounty Jar full — loot box unlocked!"
        message = f"+RM{bounty_earned:.2f} in Bounty Jar. +{xp_delta} XP. Streak: {state['walk_away_streak']}.{jar_info}"
    elif request.choice == "bnpl":
        message = "BNPL committed. Heat gauge +20. Walk away next time lah — future you will thank you."
    else:
        message = "Cash purchase logged. Heat gauge +20. Budget tightening — jaga-jaga."

    if loot_box_unlocked:
        message += " 🎁 LOOT BOX UNLOCKED — collect from Agents page!"

    return FOMOResolveResponse(
        heat_level=state["heat_level"],
        heat_delta=heat_delta,
        walk_away_streak=state["walk_away_streak"],
        bounty_jar_rm=state["bounty_jar_rm"],
        bounty_earned_rm=bounty_earned,
        xp_delta=xp_delta,
        loot_box_unlocked=loot_box_unlocked,
        message=message,
        persona_reaction=reaction,
        cooldown_until=cooldown_str,
    )


async def get_fomo_state(user_id: str) -> FOMOStateResponse:
    state = _get_state(user_id)
    cooldown = state["cooldown_until"]
    return FOMOStateResponse(
        heat_level=state["heat_level"],
        walk_away_streak=state["walk_away_streak"],
        bounty_jar_rm=state["bounty_jar_rm"],
        bounty_threshold_rm=_BOUNTY_LOOT_THRESHOLD,
        unlocked_personas=_unlocked_personas(state),
        cooldown_until=cooldown.isoformat() if cooldown else None,
    )
