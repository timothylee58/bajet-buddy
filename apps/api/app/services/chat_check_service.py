from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.config import get_settings
from app.schemas.check import (
    ChatCheckRequest,
    ChatCheckResponse,
    ChatMessage,
    CheckRequest,
    CheckResponse,
    ParsedSpendIntent,
)
from app.services.check_agent_service import run_manual_prepurchase_check

logger = logging.getLogger(__name__)

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "food": ["makan", "food", "restaurant", "cafe", "mcdonald", "kfc", "nasi", "lunch", "dinner", "breakfast", "kopi", "bubble tea", "starbucks", "mamak", "grabfood", "foodpanda", "grab food"],
    "transport": ["grab", "petrol", "minyak", "tol", "parking", "lrt", "mrt", "bus", "teksi", "taxi", "ride"],
    "shopping": ["shopee", "lazada", "tiktok shop", "dress", "shoes", "baju", "kasut", "bag", "phone", "iphone", "samsung", "nike", "adidas", "watch", "jam", "makeup", "skincare", "beli", "buy", "shopping", "mall"],
    "entertainment": ["movie", "game", "netflix", "spotify", "concert", "cinema", "wayang", "ps5", "nintendo", "steam", "youtube"],
    "health": ["doctor", "hospital", "pharmacy", "guardian", "watson", "ubat", "medicine", "gym", "fitness", "dental", "clinic"],
    "utilities": ["bill", "electric", "tnb", "water", "internet", "wifi", "phone bill", "sewa", "rent"],
    "education": ["book", "course", "tuition", "class", "buku", " subscription"],
    "other": [],
}

ESSENTIAL_KEYWORDS = ["bill", "rent", "sewa", "electric", "water", "tnb", "medicine", "ubat", "doctor", "hospital"]


def _regex_parse(message: str) -> ParsedSpendIntent | None:
    """Fallback regex-based parser when AI is unavailable."""
    text = message.lower().strip()

    # Try to extract amount: RMxxx or xxx ringgit or just a number near RM
    amount: float | None = None
    rm_match = re.search(r"rm\s*(\d+(?:\.\d{1,2})?)", text)
    if rm_match:
        amount = float(rm_match.group(1))
    else:
        # Try "xxx ringgit" or "xxx bucks"
        ringgit_match = re.search(r"(\d+(?:\.\d{1,2})?)\s*(?:ringgit|bucks|myr)", text)
        if ringgit_match:
            amount = float(ringgit_match.group(1))
        else:
            # Try standalone number that looks like a price (>10, <10000)
            numbers = re.findall(r"(?<!\w)(\d+(?:\.\d{1,2})?)(?!\w)", text)
            for n in numbers:
                val = float(n)
                if 10 <= val <= 10000:
                    amount = val
                    break

    if amount is None:
        return None

    # Category detection
    category = "shopping"
    max_matches = 0
    for cat, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text)
        if matches > max_matches:
            max_matches = matches
            category = cat

    # Merchant detection
    merchant = "Unknown"
    merchant_keywords = [
        "shopee", "lazada", "tiktok shop", "mcdonald", "kfc", "starbucks",
        "guardian", "watson", "grab", "tnb", "nike", "adidas", "uniqlo",
        "padini", "jd sports", "sports direct", "family mart", "familymart",
        "7-eleven", "aeon", "tesco", "lotus", "mydin", "nsktrade",
    ]
    for mk in merchant_keywords:
        if mk in text:
            merchant = mk.title()
            break

    # Item name — extract what comes after "buy"/"beli" or between amount and "from"/"at"/"di"
    item_name: str | None = None
    item_match = re.search(r"(?:buy|beli|nak\s+beli)\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:from|at|di|for|rm|$))", text)
    if item_match:
        item_name = item_match.group(1).strip().rstrip(",.!")
    if not item_name:
        # Try "xxx from yyy" pattern
        item_match = re.search(r"(?:a\s+|an\s+)?(.+?)\s+(?:from|at|di)\s+", text)
        if item_match:
            item_name = item_match.group(1).strip().rstrip(",.!")

    essential = any(kw in text for kw in ESSENTIAL_KEYWORDS)

    # BNPL detection
    bnpl_keywords = [
        "bnpl", "pay later", "paylater", "installment", "ansuran", "cicilan",
        "atome", "grab paylater", "spaylater", "hoolah", "split payment",
        "buy now pay later", "0% installment", "zero interest installment",
    ]
    bnpl = any(kw in text for kw in bnpl_keywords)

    bnpl_suffix = " (via BNPL)" if bnpl else ""
    return ParsedSpendIntent(
        amount=amount,
        category=category,
        merchant=merchant,
        item_name=item_name,
        merchant_type="essential" if essential else "discretionary",
        essential=essential,
        bnpl=bnpl,
        confidence=0.6,
        paraphrased=f"Spend RM{amount:.2f} on {item_name or 'item'} at {merchant} ({category}){bnpl_suffix}",
    )


async def _ai_parse(message: str) -> ParsedSpendIntent:
    """Use Claude to parse natural language into structured spend intent."""
    settings = get_settings()
    api_key = settings.ilmu_api_key or settings.anthropic_api_key

    if not api_key or not api_key.startswith("sk-"):
        raise RuntimeError("No AI API key configured")

    import anthropic

    base_url = settings.ilmu_anthropic_base_url if settings.ilmu_api_key else None
    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)

    prompt = f"""You are a spending-intent parser for BajetBuddy, a Malaysian personal finance app.
Extract structured fields from the user's natural language message.
Return strict JSON only.

User message: "{message}"

Categories (pick the best match):
- food: makan, restaurants, groceries, grab food, bubble tea
- transport: petrol, grab rides, parking, toll
- shopping: clothes, electronics, shopee, lazada, retail
- entertainment: movies, games, subscriptions
- health: medicine, doctor, pharmacy, gym
- utilities: bills, rent, electricity, water
- education: books, courses, tuition
- other: none of the above

JSON shape:
{{
  "amount": <float, the price in RM, REQUIRED>,
  "category": "<category id>",
  "merchant": "<store or platform name, or 'Unknown'>",
  "item_name": "<the item they want to buy, or null>",
  "merchant_type": "essential|discretionary|mixed",
  "essential": <bool>,
  "bnpl": <bool, true if user mentions BNPL, pay later, installment, ansuran, cicilan, Atome, Grab PayLater, SPayLater, Hoolah, or any buy-now-pay-later scheme>,
  "confidence": <float 0-1, how confident you are in this parse>,
  "paraphrased": "<a natural Malaysian/Manglish paraphrase confirming what you understood, mention BNPL if applicable>"
}}

Rules:
- If no amount found, set amount to 0 and confidence to 0
- Default category is "shopping"
- For Grab rides use "transport", for GrabFood use "food"
- Be generous with item_name extraction
- bnpl detection is IMPORTANT: if user says "using BNPL", "pay later", "installment", "ansuran", "cicilan", "atome", "grab paylater", "spaylater", "hoolah", "split payment" → set bnpl=true
- paraphrased should sound like a friendly Malaysian confirming the spend, e.g. "OK, you nak beli Nike Air Max for RM450 from JD Sports, category shopping. BNPL: no."
- If bnpl=true, paraphrased should warn: "ALERT: you're considering BNPL for this purchase" """

    try:
        resp = await client.messages.create(
            model=settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start < 0 or end <= start:
            raise ValueError("No JSON in AI response")
        data = json.loads(text[start:end])
        if data.get("amount", 0) <= 0:
            raise ValueError("AI could not extract amount")
        return ParsedSpendIntent(**data)
    except Exception:
        raise


async def parse_spend_intent(message: str) -> ParsedSpendIntent:
    """Parse natural language into structured spend intent, with AI → regex fallback."""
    try:
        return await _ai_parse(message)
    except Exception as exc:
        logger.warning("AI spend-intent parse failed, falling back to regex: %s", exc)
        parsed = _regex_parse(message)
        if parsed is None:
            raise ValueError(f"Could not extract spend amount from: {message}") from exc
        return parsed


def _build_chat_messages(
    user_message: str,
    parsed: ParsedSpendIntent,
    result: Any,
    language_preference: str,
) -> list[ChatMessage]:
    """Build the conversational chat messages for the response."""
    nudge = result.nudge_bm if language_preference == "bm" else result.nudge_en
    verdict_emoji = {"boleh": "✅", "fikir_dulu": "🤔", "jangan_dulu": "❌"}
    emoji = verdict_emoji.get(result.verdict, "🤖")

    # Agent 2: Finance Planner — negotiation intro
    if result.verdict == "jangan_dulu":
        negotiation_intro = (
            "I ada 3 options for you:\n"
            "💰 Option A — Buy with cash (but this will makan your daily runway)\n"
            "📉 Option B — Use BNPL (tapi nanti your financial health drop)\n"
            "🧘 Option C — Walk away for 48 hours (earn +200 Discipline XP!)\n\n"
            "Mana satu you nak pilih?"
        )
    elif result.verdict == "fikir_dulu":
        negotiation_intro = (
            "You boleh proceed, tapi fikir dulu. This purchase will squeeze your budget a bit.\n"
            "Option A — Buy now, tighter week ahead\n"
            "Option B — Wait 24 hours, see if you still want it\n"
            "Option C — Save to wishlist, revisit after salary\n\n"
            "What do you think?"
        )
    else:
        negotiation_intro = (
            "Your budget still looks healthy after this spend. If you really need it, go ahead!\n"
            "But remember — small spends add up. Keep tracking, yeah? 💪"
        )
    # Persona context
    persona_line = ""
    if result.persona:
        persona_line = f"🕵️ Your persona: **{result.persona.name}** {result.persona.emoji} — {result.persona.description}\n\n"

    # Budget context with numbers
    budget_line = ""
    if result.projected_remaining_balance is not None:
        daily = result.projected_daily_survival_amount or 0
        remaining = result.projected_remaining_balance
        budget_line = f"💳 After this: **RM{remaining:.2f}** left, ~RM{daily:.2f}/day\n"

    # Risk factors as readable tags
    risk_tags = ""
    if result.reason_codes:
        friendly_names = {
            "LOW_DAILY_SURVIVAL": "daily runway too low",
            "DAILY_SURVIVAL_BELOW_RM25": "below RM25/day",
            "DAILY_SURVIVAL_TIGHT": "tight daily budget",
            "HIGH_CATEGORY_USAGE": f"{parsed.category} budget nearly full",
            "CATEGORY_BUDGET_ABOVE_85": f"{parsed.category} over 85% used",
            "DISCRETIONARY_PURCHASE": "want vs need check",
            "BNPL_DUE_THIS_MONTH": "BNPL payment due",
            "BNPL_DUE_WITHIN_7_DAYS": "BNPL due this week",
            "END_OF_MONTH_PRESSURE": "late in salary cycle",
            "MIDNIGHT_SPENDING_PATTERN": "late-night impulse zone",
            "LATE_NIGHT_PURCHASE": "late-night purchase",
        }
        tags = [friendly_names.get(c, c) for c in result.reason_codes[:4]]
        risk_tags = "🔍 " + " · ".join(tags) + "\n"

    # Agent 2: Finance Planner — negotiation intro
    if result.verdict == "jangan_dulu":
        negotiation_intro = (
            "I ada 3 options for you:\n"
            "💰 Option A — Buy with cash (but this will makan your daily runway)\n"
            "📉 Option B — Use BNPL (tapi nanti your financial health drop)\n"
            "🧘 Option C — Walk away for 48 hours (earn +200 Discipline XP!)\n\n"
            "Mana satu you nak pilih?"
        )
    elif result.verdict == "fikir_dulu":
        negotiation_intro = (
            "You boleh proceed, tapi fikir dulu. This purchase will squeeze your budget a bit.\n"
            "Option A — Buy now, tighter week ahead\n"
            "Option B — Wait 24 hours, see if you still want it\n"
            "Option C — Save to wishlist, revisit after salary\n\n"
            "What do you think?"
        )
    else:
        negotiation_intro = (
            "Your budget still looks healthy after this spend. If you really need it, go ahead!\n"
            "But remember — small spends add up. Keep tracking, yeah? 💪"
        )

    ai_content = (
        f"{emoji} **{result.verdict.upper().replace('_', ' ')}**\n\n"
        f"{persona_line}"
        f"{nudge}\n\n"
        f"{budget_line}"
        f"{risk_tags}"
        f"📊 Risk: {result.risk_score}/100 | Budget impact: {result.budget_impact_pct:.0f}%\n"
        f"{'⚠️ Proactive alert triggered!' if result.proactive_alert else ''}\n\n"
        f"{negotiation_intro}"
    )

    return [
        ChatMessage(role="user", content=user_message),
        ChatMessage(role="bajetbuddy", content=parsed.paraphrased),
        ChatMessage(role="bajetbuddy", content=ai_content),
    ]


async def run_chat_check(payload: ChatCheckRequest, user_id: str = "00000000-0000-0000-0000-000000000001") -> ChatCheckResponse:
    """Full chat-based pre-purchase check: parse → reason → respond."""
    try:
        parsed = await parse_spend_intent(payload.message)
    except ValueError:
        # Friendly error when no spend amount can be extracted
        error_message = (
            "Sorry, I couldn't find a spend amount in your message. "
            "Please include the price, like 'Should I buy a RM189 dress from Shopee?' "
            "or 'I want to spend RM50 on lunch.'"
        )
        return ChatCheckResponse(
            messages=[
                ChatMessage(role="user", content=payload.message),
                ChatMessage(role="bajetbuddy", content=error_message),
            ],
            result=CheckResponse(
                verdict="fikir_dulu",
                nudge_bm="Saya tak dapat kesan jumlah perbelanjaan. Sila masukkan harga.",
                nudge_en="I couldn't detect a spend amount. Please include a price.",
                risk_score=0,
                budget_impact_pct=0,
                xp_earned=0,
            ),
            parsed_intent=ParsedSpendIntent(
                amount=0,
                category="other",
                merchant="Unknown",
                confidence=0,
                paraphrased="Could not parse spend amount",
            ),
        )

    # Auto-classify category types: food/transport/health → mixed, utilities → essential
    auto_type = parsed.merchant_type
    if auto_type == "discretionary":
        if parsed.category in ("food", "transport", "health", "utilities", "education"):
            auto_type = "mixed"
        if parsed.category == "utilities":
            auto_type = "essential"

    check_req = CheckRequest(
        amount=parsed.amount,
        category=parsed.category,
        merchant=parsed.merchant,
        merchant_type=auto_type,
        item_name=parsed.item_name,
        essential=parsed.essential or parsed.category == "utilities",
        bnpl=parsed.bnpl,
        language_preference=payload.language_preference,
        tone_mode=payload.tone_mode,
        purchase_at=payload.purchase_at,
    )

    result = await run_manual_prepurchase_check(check_req, user_id=user_id)
    messages = _build_chat_messages(payload.message, parsed, result, payload.language_preference)

    return ChatCheckResponse(
        messages=messages,
        result=result,
        parsed_intent=parsed,
    )
