from __future__ import annotations

import logging
import re
import statistics
from collections import Counter
from datetime import date, datetime, timedelta

import anthropic

from app.core.config import get_settings
from app.schemas.recurring import Cadence, RecurringSubscription, RecurringSummary
from app.services.budget_service import get_budget_summary
from app.services.transaction_service import get_user_transactions

logger = logging.getLogger(__name__)

MIN_OCCURRENCES = 3

# Day-gap window and monthly multiplier for each rhythm we recognise. Windows are
# deliberately wide because real billing dates drift with weekends and month length.
_CADENCE_RULES: list[tuple[Cadence, int, int, float]] = [
    ("weekly", 5, 9, 52 / 12),
    ("fortnightly", 12, 17, 26 / 12),
    ("monthly", 25, 36, 1.0),
    ("quarterly", 80, 100, 1 / 3),
    ("yearly", 350, 380, 1 / 12),
]

# A subscription bills the same amount every time; a coincidence of three visits to
# the same kopitiam does not. Anything above this relative spread is not recurring.
_MAX_AMOUNT_SPREAD = 0.18


def _normalize_merchant(raw: str) -> str:
    cleaned = re.sub(r"[^a-z0-9 ]", " ", raw.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def _parse_timestamp(value: object) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        try:
            return datetime.strptime(text[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def _match_cadence(median_gap: float) -> tuple[Cadence, float] | None:
    for cadence, low, high, monthly_multiplier in _CADENCE_RULES:
        if low <= median_gap <= high:
            return cadence, monthly_multiplier
    return None


def _relative_spread(values: list[float]) -> float:
    mean = statistics.fmean(values)
    if mean <= 0:
        return 1.0
    if len(values) < 2:
        return 0.0
    return statistics.pstdev(values) / mean


def _confidence(occurrences: int, gaps: list[int], amount_spread: float) -> int:
    volume = min(occurrences, 8) / 8
    median_gap = statistics.median(gaps)
    gap_drift = _relative_spread([float(g) for g in gaps]) if median_gap > 0 else 1.0
    regularity = max(0.0, 1.0 - gap_drift * 2.5)
    stability = max(0.0, 1.0 - amount_spread / _MAX_AMOUNT_SPREAD)
    score = 0.30 * volume + 0.40 * regularity + 0.30 * stability
    return max(0, min(100, round(score * 100)))


def _detect_from_group(rows: list[dict], today: date) -> RecurringSubscription | None:
    dated = []
    for row in rows:
        charged_on = _parse_timestamp(row.get("created_at"))
        amount = float(row.get("amount") or 0.0)
        if charged_on is None or amount <= 0:
            continue
        dated.append((charged_on, amount, row))

    if len(dated) < MIN_OCCURRENCES:
        return None

    dated.sort(key=lambda item: item[0])
    gaps = [(dated[i][0] - dated[i - 1][0]).days for i in range(1, len(dated))]
    gaps = [gap for gap in gaps if gap > 0]
    if len(gaps) < MIN_OCCURRENCES - 1:
        return None

    matched = _match_cadence(statistics.median(gaps))
    if matched is None:
        return None
    cadence, monthly_multiplier = matched

    amounts = [amount for _, amount, _ in dated]
    amount_spread = _relative_spread(amounts)
    if amount_spread > _MAX_AMOUNT_SPREAD:
        return None

    average_amount = statistics.fmean(amounts)
    monthly_cost = average_amount * monthly_multiplier
    last_charged_on, _, last_row = dated[-1]
    next_expected = last_charged_on + timedelta(days=round(statistics.median(gaps)))

    display_names = Counter(str(row.get("merchant") or "").strip() for _, _, row in dated)
    display_name = next((name for name, _ in display_names.most_common() if name), "Unknown")

    return RecurringSubscription(
        merchant=display_name,
        category=str(last_row.get("category") or "other"),
        cadence=cadence,
        average_amount_rm=round(average_amount, 2),
        monthly_cost_rm=round(monthly_cost, 2),
        annual_cost_rm=round(monthly_cost * 12, 2),
        occurrences=len(dated),
        last_charged_at=last_charged_on.isoformat(),
        next_expected_at=next_expected.isoformat(),
        confidence=_confidence(len(dated), gaps, amount_spread),
        is_overdue=next_expected < today,
    )


def detect_subscriptions(transactions: list[dict], today: date) -> list[RecurringSubscription]:
    groups: dict[str, list[dict]] = {}
    for row in transactions:
        merchant = str(row.get("merchant") or "").strip()
        if not merchant:
            continue
        key = _normalize_merchant(merchant)
        if not key:
            continue
        groups.setdefault(key, []).append(row)

    detected = []
    for rows in groups.values():
        if len(rows) < MIN_OCCURRENCES:
            continue
        subscription = _detect_from_group(rows, today)
        if subscription is not None:
            detected.append(subscription)

    detected.sort(key=lambda item: item.annual_cost_rm, reverse=True)
    return detected


def _fallback_insight(subscriptions: list[RecurringSubscription], total_monthly: float) -> str:
    if not subscriptions:
        return "No recurring charges detected yet — log a few more months and we'll spot them."
    biggest = subscriptions[0]
    return (
        f"You're locked into {len(subscriptions)} recurring charge"
        f"{'s' if len(subscriptions) > 1 else ''} costing RM{total_monthly:.2f} a month. "
        f"{biggest.merchant} is the heaviest at RM{biggest.annual_cost_rm:.2f} a year."
    )


async def _generate_insight(
    subscriptions: list[RecurringSubscription],
    total_monthly: float,
    pct_of_income: float | None,
) -> str:
    fallback = _fallback_insight(subscriptions, total_monthly)
    if not subscriptions:
        return fallback

    settings = get_settings()
    api_key = settings.ilmu_api_key or settings.anthropic_api_key
    if not api_key:
        return fallback

    lines = "\n".join(
        f"- {s.merchant} ({s.category}): RM{s.average_amount_rm:.2f} {s.cadence}, "
        f"RM{s.annual_cost_rm:.2f}/year"
        for s in subscriptions[:8]
    )
    income_line = (
        f"That is {pct_of_income:.1f}% of their monthly income."
        if pct_of_income is not None
        else "Their monthly income is unknown."
    )

    try:
        client = anthropic.AsyncAnthropic(
            api_key=api_key,
            base_url=settings.ilmu_anthropic_base_url,
        )
        model = settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5"
        message = await client.messages.create(
            model=model,
            max_tokens=180,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "You are a blunt but caring Malaysian money buddy. These are a young "
                        "Malaysian's detected recurring subscriptions:\n"
                        f"{lines}\n\n"
                        f"Total: RM{total_monthly:.2f} per month. {income_line}\n\n"
                        "Write ONE sentence (max 30 words) in casual Manglish telling them what this "
                        "subscription load means and which one to cut first. No preamble, no quotes, "
                        "just the sentence."
                    ),
                }
            ],
        )
        parts = [block.text for block in message.content if getattr(block, "type", None) == "text"]
        text = " ".join(parts).strip().strip('"')
        return text or fallback
    except Exception as exc:
        logger.warning("Recurring insight generation failed, using fallback: %s", exc)
        return fallback


async def get_recurring_summary(user_id: str) -> RecurringSummary:
    transactions = await get_user_transactions(user_id)
    subscriptions = detect_subscriptions(transactions, date.today())

    total_monthly = round(sum(s.monthly_cost_rm for s in subscriptions), 2)

    pct_of_income: float | None = None
    try:
        budget = await get_budget_summary(user_id)
        income = float(budget.get("total_income") or 0.0)
        if income > 0:
            pct_of_income = round(total_monthly / income * 100, 1)
    except Exception as exc:
        logger.warning("Could not resolve income for recurring summary: %s", exc)

    insight = await _generate_insight(subscriptions, total_monthly, pct_of_income)

    return RecurringSummary(
        subscriptions=subscriptions,
        total_monthly_rm=total_monthly,
        total_annual_rm=round(total_monthly * 12, 2),
        pct_of_income=pct_of_income,
        insight=insight,
    )
