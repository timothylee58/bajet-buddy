"""Alt-credit scoring engine — repackages existing behavioural signals into a
300-850 style score partner lenders can consume. Deliberately does not touch
the /api/check hot path: this is a parallel, on-demand read path.

Reuses real service functions (get_budget_summary, get_user_transactions,
get_persona_for_user) plus two direct Supabase reads for data the existing
services don't expose (freeze events, BNPL outstanding balance).
"""
from __future__ import annotations

import logging
import statistics
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.core.database import get_supabase
from app.services.budget_service import get_budget_summary
from app.services.persona_service import get_persona_for_user
from app.services.transaction_service import get_user_transactions

logger = logging.getLogger(__name__)

MIN_HISTORY_DAYS = 90


@dataclass(slots=True)
class ScoreFactorDetail:
    name: str
    value: float
    weight: float
    contribution: float


@dataclass(slots=True)
class CreditScoreResult:
    score: int | None
    band: str | None
    insufficient_history: bool
    factors: list[ScoreFactorDetail]


def _band_for_score(score: int) -> str:
    if score < 580:
        return "Poor"
    if score < 670:
        return "Fair"
    if score < 740:
        return "Good"
    if score < 800:
        return "Very Good"
    return "Excellent"


def _parse_datetime(value: object) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


async def _fetch_freeze_events_since(user_id: str, since: datetime) -> int:
    """Count freeze_events rows for this user started within the window."""
    supabase = get_supabase()
    if supabase is None:
        return 0
    try:
        res = (
            supabase.table("freeze_events")
            .select("id, started_at")
            .eq("user_id", user_id)
            .gte("started_at", since.isoformat())
            .execute()
        )
        return len(res.data) if res.data else 0
    except Exception as e:
        logger.warning("Failed to fetch freeze events for %s: %s", user_id, e)
        return 0


async def _fetch_bnpl_outstanding(user_id: str) -> float:
    """Sum outstanding_amount across active/late bnpl_commitments rows."""
    supabase = get_supabase()
    if supabase is None:
        return 0.0
    try:
        res = (
            supabase.table("bnpl_commitments")
            .select("outstanding_amount, status")
            .eq("user_id", user_id)
            .execute()
        )
        if not res.data:
            return 0.0
        return sum(
            float(row.get("outstanding_amount") or 0)
            for row in res.data
            if row.get("status") in {"active", "late"}
        )
    except Exception as e:
        logger.warning("Failed to fetch BNPL outstanding for %s: %s", user_id, e)
        return 0.0


def _budget_adherence(transactions: list[dict], monthly_income: float, now: datetime) -> float:
    """Proxy for '% of last 90 days where budget stayed non-negative'.

    No historical per-cycle budget snapshot table exists, so this buckets the
    last 90 days of transactions into three 30-day windows and checks whether
    spend in each window stayed within a proportional share of income.
    """
    if monthly_income <= 0:
        return 0.5

    window_days = 30
    windows_ok = 0
    windows_with_data = 0
    for window_index in range(3):
        window_end = now - timedelta(days=window_index * window_days)
        window_start = window_end - timedelta(days=window_days)
        window_spend = sum(
            abs(float(t.get("amount") or 0))
            for t in transactions
            if t.get("category") != "income"
            and float(t.get("amount") or 0) < 0
            and (parsed := _parse_datetime(t.get("created_at"))) is not None
            and window_start <= parsed < window_end
        )
        has_data = any(
            (parsed := _parse_datetime(t.get("created_at"))) is not None
            and window_start <= parsed < window_end
            for t in transactions
        )
        if has_data:
            windows_with_data += 1
            if window_spend <= monthly_income:
                windows_ok += 1

    if windows_with_data == 0:
        return 0.5
    return windows_ok / windows_with_data


def _velocity_stability(transactions: list[dict]) -> float:
    """Inverse of daily-spend variance — impulsive spend spikes hurt this."""
    daily_totals: dict[str, float] = {}
    for t in transactions:
        if t.get("category") == "income" or float(t.get("amount") or 0) >= 0:
            continue
        parsed = _parse_datetime(t.get("created_at"))
        if parsed is None:
            continue
        day_key = parsed.date().isoformat()
        daily_totals[day_key] = daily_totals.get(day_key, 0.0) + abs(float(t.get("amount") or 0))

    values = list(daily_totals.values())
    if len(values) < 2:
        return 0.5

    mean = statistics.mean(values)
    if mean == 0:
        return 0.5
    coefficient_of_variation = statistics.pstdev(values) / mean
    return max(0.0, min(1.0, 1 / (1 + coefficient_of_variation)))


def _has_sufficient_history(transactions: list[dict], now: datetime) -> bool:
    if not transactions:
        return False
    oldest = min(
        (parsed for t in transactions if (parsed := _parse_datetime(t.get("created_at"))) is not None),
        default=None,
    )
    if oldest is None:
        return False
    return (now - oldest) >= timedelta(days=MIN_HISTORY_DAYS)


async def compute_credit_score(user_id: str) -> CreditScoreResult:
    now = datetime.now(timezone.utc)

    transactions = await get_user_transactions(user_id)
    if not _has_sufficient_history(transactions, now):
        return CreditScoreResult(score=None, band=None, insufficient_history=True, factors=[])

    budget_summary = await get_budget_summary(user_id)
    monthly_income = float(budget_summary.get("total_income") or 0.0)

    bnpl_outstanding = await _fetch_bnpl_outstanding(user_id)
    bnpl_ratio = min(1.0, bnpl_outstanding / monthly_income) if monthly_income > 0 else 0.0

    freeze_count_60d = await _fetch_freeze_events_since(user_id, now - timedelta(days=60))
    freeze_cleanliness = max(0.0, 1 - min(freeze_count_60d / 4, 1.0))

    velocity_stability = _velocity_stability(transactions)
    budget_adherence = _budget_adherence(transactions, monthly_income, now)

    # persona_stability proxy: no re-evaluation history is persisted anywhere
    # in the codebase (see PR description) — the latest persona snapshot's
    # own confidence score stands in for archetype stability.
    try:
        persona, _meta = await get_persona_for_user(user_id)
        persona_stability = max(0.0, min(1.0, persona.confidence / 100))
    except Exception as e:
        logger.warning("Failed to fetch persona for credit score, defaulting stability: %s", e)
        persona_stability = 0.5

    factors = [
        ScoreFactorDetail("budget_adherence", budget_adherence, 0.30, budget_adherence * 0.30),
        ScoreFactorDetail("bnpl_ratio", 1 - bnpl_ratio, 0.25, (1 - bnpl_ratio) * 0.25),
        ScoreFactorDetail("freeze_cleanliness", freeze_cleanliness, 0.20, freeze_cleanliness * 0.20),
        ScoreFactorDetail("velocity_stability", velocity_stability, 0.15, velocity_stability * 0.15),
        ScoreFactorDetail("persona_stability", persona_stability, 0.10, persona_stability * 0.10),
    ]
    raw = sum(f.contribution for f in factors)
    score = int(300 + round(raw * 550))
    score = max(300, min(850, score))

    return CreditScoreResult(
        score=score,
        band=_band_for_score(score),
        insufficient_history=False,
        factors=factors,
    )


async def compute_and_store_credit_score(user_id: str) -> CreditScoreResult:
    result = await compute_credit_score(user_id)
    supabase = get_supabase()
    if supabase is not None:
        try:
            supabase.table("credit_scores").insert(
                {
                    "user_id": user_id,
                    "score": result.score,
                    "band": result.band,
                    "insufficient_history": result.insufficient_history,
                    "factors_json": {f.name: f.value for f in result.factors},
                }
            ).execute()
        except Exception as e:
            logger.warning("Failed to persist credit score for %s: %s", user_id, e)
    return result
