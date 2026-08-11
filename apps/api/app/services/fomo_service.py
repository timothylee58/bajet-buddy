from __future__ import annotations

import asyncio
import json
import logging
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

logger = logging.getLogger("fomo_service")

# The event loop only holds weak references to tasks, so a fire-and-forget
# dispatch can be garbage-collected before it finishes. Keep a strong reference
# until it completes.
_background_tasks: set[asyncio.Task] = set()

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
    interaction_history: list[dict]


_fomo_store: dict[str, FOMOState] = {}
_regret_store: dict[str, str] = {}


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
            "interaction_history": [],
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
    import re
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        text = text[start:end]
    return text.strip()


async def _predict_regret(
    amount: float,
    category: str,
    current_balance: float,
    bnpl_load: float,
    days_until_salary: int,
    interaction_history: list[dict],
    user_id: str,
) -> int:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
    )
    model = settings.ilmu_model or "claude-opus-4-5"

    prompt = (
        f"User is considering buying RM{amount} in category {category}. "
        f"Balance: RM{current_balance}. BNPL load: RM{bnpl_load}. "
        f"Days until salary: {days_until_salary}. "
        f"Past 3 negotiations: {json.dumps(interaction_history[-3:])}. "
        "Based on typical Malaysian spending psychology, what is the probability (0-100) "
        "that this user will regret this purchase within 24 hours? "
        'Return only JSON: {"regret_probability": <int>, "regret_reason": "<1 phrase>"}'
    )

    response = await client.messages.create(
        model=model,
        max_tokens=100,
        system="You are a Malaysian financial psychology expert. Respond ONLY with valid JSON, no markdown fences.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text  # type: ignore[index]
    data = json.loads(_strip_fences(raw))
    _regret_store[user_id] = data.get("regret_reason", "")
    return int(data.get("regret_probability", 0))


async def _call_claude(
    item_name: str,
    merchant: str,
    amount: float,
    category: str,
    persona_code: PersonaCode,
    emotional_state: EmotionalState,
    heat_level: float,
    interaction_history: list[dict] | None = None,
    hour_of_day: int = 12,
    category_repeat_count: int = 0,
) -> dict[str, str | int]:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
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

    history_section = ""
    if interaction_history:
        history_section = (
            f"\nPast 3 interactions: {json.dumps(interaction_history[-3:])}\n"
            "Adapt your tone based on this history — if user keeps buying anyway, be more direct. "
            "If user keeps walking away, give more praise."
        )

    prompt = (
        f"Purchase: {item_name} at {merchant}, RM{amount:.2f}, category: {category}.\n"
        f"Emotional state: {emotional_state}. {emotional_context_map[emotional_state]}\n"
        f"FOMO gauge: {heat_context}.\n"
        f"Hour of day: {hour_of_day} (0-23). Category repeat purchases this session: {category_repeat_count}.\n"
        f"{history_section}\n"
        "Return ONLY valid JSON with exactly these 5 keys:\n"
        "- fomo_validation: 1-2 sentences validating the FOMO (warm, relatable, persona voice)\n"
        "- trap_exposure: 1-2 sentences exposing the hidden financial/psychological trap (honest, persona voice)\n"
        "- persona_quip: 1 punchy one-liner in full persona voice, max 15 words\n"
        "- heat_adjustment: integer from -20 to +30 based on time-of-day risk (midnight=high), category repeats, emotional state, BNPL pressure\n"
        "- heat_reasoning: 1 short phrase explaining the heat adjustment"
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

    interaction_history = state.get("interaction_history", [])
    hour_now = datetime.now(tz=timezone.utc).hour
    try:
        claude_data = await _call_claude(
            request.item_name, request.merchant, request.amount,
            request.category, persona_code, request.emotional_state, state["heat_level"],
            interaction_history=interaction_history,
            hour_of_day=hour_now,
            category_repeat_count=0,
        )
    except Exception as e:
        logger.warning("_call_claude failed (non-fatal): %s", e)
        claude_data = {
            "fomo_validation": "I understand the temptation lah.",
            "trap_exposure": "But let's think about this carefully first.",
            "persona_quip": "Wallet crying, heart wanting — classic Malaysian dilemma.",
            "heat_adjustment": 0,
            "heat_reasoning": "stable",
        }

    heat_adj = int(claude_data.get("heat_adjustment", 0))
    state["heat_level"] = max(0.0, min(_HEAT_MAX, state["heat_level"] + heat_adj))

    try:
        regret_probability = await _predict_regret(
            amount=request.amount,
            category=request.category,
            current_balance=request.current_balance,
            bnpl_load=request.bnpl_load,
            days_until_salary=request.days_until_salary,
            interaction_history=interaction_history,
            user_id=user_id,
        )
    except Exception as e:
        logger.warning("_predict_regret failed (non-fatal): %s", e)
        regret_probability = 50

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
        fomo_validation=str(claude_data.get("fomo_validation", "")),
        trap_exposure=str(claude_data.get("trap_exposure", "")),
        persona_quip=str(claude_data.get("persona_quip", "")),
        option_cash=cash_opt,
        option_bnpl=bnpl_opt,
        option_walk_away=walk_opt,
        heat_level=state["heat_level"],
        walk_away_streak=state["walk_away_streak"],
        bounty_jar_rm=state["bounty_jar_rm"],
        heat_reasoning=str(claude_data.get("heat_reasoning", "")),
        regret_probability=regret_probability,
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

    persona_code_for_history = _resolve_persona("pak_cik_audit", request.emotional_state, state)
    state["interaction_history"] = ([*state.get("interaction_history", []), {
        "choice": request.choice,
        "category": request.category,
        "amount": request.amount,
        "emotional_state": request.emotional_state.value if hasattr(request.emotional_state, "value") else request.emotional_state,
        "persona": persona_code_for_history,
    }])[-5:]

    # ── Cross-agent dispatch: fan out the decision to every AI agent ──────
    from app.services.fomo_actions import dispatch_fomo_outcome

    dispatch = asyncio.create_task(dispatch_fomo_outcome(
        user_id=user_id,
        choice=request.choice,
        amount=request.amount,
        category=request.category,
        emotional_state=request.emotional_state.value if hasattr(request.emotional_state, "value") else request.emotional_state,
    ))
    _background_tasks.add(dispatch)
    dispatch.add_done_callback(_background_tasks.discard)

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


async def recommend_persona(user_id: str, recent_choices: list[str], spending_summary: dict) -> dict:
    settings = get_settings()
    client = anthropic.AsyncAnthropic(
        api_key=settings.ilmu_api_key or settings.anthropic_api_key,
        base_url=settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None,
    )
    model = settings.ilmu_model or "claude-opus-4-5"

    prompt = (
        f"User negotiation history (last 5 choices): {json.dumps(recent_choices)}\n"
        f"Spending summary by category: {json.dumps(spending_summary)}\n\n"
        "Given this user's negotiation history and spending patterns, which persona "
        "(pak_cik_audit / kak_therapist / meme_goblin / ice_cfo / hype_man) would be most "
        "effective at helping them walk away from impulse purchases?\n"
        'Return JSON: {"recommended_persona": "<persona_code>", "reasoning": "<1-2 sentences>"}'
    )

    response = await client.messages.create(
        model=model,
        max_tokens=200,
        system="You are a Malaysian financial coaching expert. Respond ONLY with valid JSON, no markdown fences.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text  # type: ignore[index]
    return json.loads(_strip_fences(raw))


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
