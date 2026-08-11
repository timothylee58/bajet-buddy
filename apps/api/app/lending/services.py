"""Lending module orchestration — credit scoring (P11) and the referral
marketplace (P12). Kept as one module because both phases share the same
/api/lending prefix and the marketplace directly consumes the score.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.cache import cache_get, cache_set
from app.core.database import get_supabase
from app.lending.partner_adapters.base import LendingContext, LendingPartnerAdapter
from app.lending.partner_adapters.mock_cimb_adapter import MockCimbAdapter
from app.lending.schemas import (
    ApplicationStatus,
    CreditScoreResponse,
    LoanApplicationOut,
    LoanOfferOut,
    RepaymentOut,
    ScoreFactor,
)
from app.risk_engine.credit_score import (
    _fetch_bnpl_outstanding,
    compute_and_store_credit_score,
)
from app.services.budget_service import _current_month_days, get_budget_summary
from app.services.freeze_service import get_freeze_status

logger = logging.getLogger(__name__)

SCORE_CACHE_TTL_SECONDS = 24 * 60 * 60


def _parse_datetime(value: object) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None

# Swapping the mock for a real partner later is changing this one line.
_adapter: LendingPartnerAdapter = MockCimbAdapter()


def _score_cache_key(user_id: str) -> str:
    return f"credit_score:{user_id}"


def _result_to_response(result) -> CreditScoreResponse:
    return CreditScoreResponse(
        score=result.score,
        band=result.band,
        insufficient_history=result.insufficient_history,
        factors=[
            ScoreFactor(name=f.name, value=f.value, weight=f.weight, contribution=f.contribution)
            for f in result.factors
        ],
        computed_at=datetime.now(timezone.utc),
    )


async def get_or_compute_credit_score(user_id: str) -> CreditScoreResponse:
    """1 real compute per user per 24h — cached response otherwise (Redis,
    falls through to a fresh compute if Redis is unavailable)."""
    cache_key = _score_cache_key(user_id)
    cached = await cache_get(cache_key)
    if cached:
        try:
            return CreditScoreResponse.model_validate_json(cached)
        except Exception as e:
            logger.warning("Failed to parse cached credit score for %s: %s", user_id, e)

    result = await compute_and_store_credit_score(user_id)
    response = _result_to_response(result)
    await cache_set(cache_key, response.model_dump_json(), ttl=SCORE_CACHE_TTL_SECONDS)
    return response


# ─── P12: Lending referral marketplace ─────────────────────────────────────


def _total_repayable(amount: float, apr: float, tenure_months: int) -> float:
    """Simple-interest approximation, disclosed up front per Responsible
    Lending Guidelines formatting (amount, APR, tenure, total repayable)."""
    return round(amount * (1 + (apr / 100) * (tenure_months / 12)), 2)


async def _build_lending_context(user_id: str) -> LendingContext:
    freeze_status = get_freeze_status(user_id)
    budget_summary = await get_budget_summary(user_id)
    bnpl_outstanding = await _fetch_bnpl_outstanding(user_id)
    day_of_cycle, _total_days, days_left = _current_month_days()

    return LendingContext(
        has_active_freeze=bool(freeze_status.get("active")),
        bnpl_outstanding=bnpl_outstanding,
        days_until_salary=days_left,
        day_of_cycle=day_of_cycle,
        budget_remaining=float(budget_summary.get("remaining") or 0.0),
        monthly_income=float(budget_summary.get("total_income") or 0.0),
    )


async def get_offers_for_user(user_id: str) -> list[LoanOfferOut]:
    score_response = await get_or_compute_credit_score(user_id)
    if score_response.insufficient_history:
        return []

    context = await _build_lending_context(user_id)
    factors = {f.name: f.value for f in score_response.factors}
    offers = await _adapter.get_offers(user_id, score_response.score, factors, context)

    supabase = get_supabase()
    # Offer ids are deterministic (same user+context -> same id), so a
    # recompute must not clobber an offer that's already been applied to —
    # only ever upsert rows that are still in the "offered" state.
    already_applied: set[str] = set()
    if supabase is not None and offers:
        try:
            existing = (
                supabase.table("loan_offers")
                .select("id, status")
                .in_("id", [o.id for o in offers])
                .execute()
            )
            already_applied = {row["id"] for row in (existing.data or []) if row.get("status") != "offered"}
        except Exception as e:
            logger.warning("Failed to check existing loan offer statuses for %s: %s", user_id, e)

        for offer in offers:
            if offer.id in already_applied:
                continue
            try:
                supabase.table("loan_offers").upsert(
                    {
                        "id": offer.id,
                        "user_id": user_id,
                        "partner_name": offer.partner_name,
                        "product_type": offer.product_type,
                        "amount": offer.amount,
                        "apr": offer.apr,
                        "tenure_months": offer.tenure_months,
                        "min_score_required": offer.min_score_required,
                        "status": "offered",
                        "reason_json": {"reason": offer.reason},
                        "expires_at": offer.expires_at.isoformat(),
                    }
                ).execute()
            except Exception as e:
                logger.warning("Failed to persist loan offer %s for %s: %s", offer.id, user_id, e)

    return [
        LoanOfferOut(
            id=offer.id,
            partner_name=offer.partner_name,
            product_type=offer.product_type,
            amount=offer.amount,
            apr=offer.apr,
            tenure_months=offer.tenure_months,
            total_repayable=_total_repayable(offer.amount, offer.apr, offer.tenure_months),
            min_score_required=offer.min_score_required,
            reason=offer.reason,
            expires_at=offer.expires_at,
        )
        for offer in offers
        if offer.id not in already_applied
    ]


def _build_repayment_schedule(total_repayable: float, tenure_months: int, start: date) -> list[dict]:
    installment = round(total_repayable / tenure_months, 2)
    schedule = []
    for i in range(1, tenure_months + 1):
        due = start + timedelta(days=30 * i)
        amount = installment
        if i == tenure_months:
            # last installment absorbs any rounding remainder
            amount = round(total_repayable - (installment * (tenure_months - 1)), 2)
        schedule.append({"due_date": due.isoformat(), "amount": amount, "status": "upcoming"})
    return schedule


async def _fetch_application_by_idempotency_key(
    supabase, offer_id: str, idempotency_key: str
) -> dict | None:
    try:
        res = (
            supabase.table("loan_applications")
            .select("*")
            .eq("offer_id", offer_id)
            .eq("idempotency_key", idempotency_key)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        logger.warning("Failed to check existing application for offer %s: %s", offer_id, e)
        return None
    else:
        return res.data if res else None


async def _fetch_repayments(supabase, application_id: str) -> list[RepaymentOut]:
    try:
        res = (
            supabase.table("repayments")
            .select("*")
            .eq("application_id", application_id)
            .order("due_date")
            .execute()
        )
        return [
            RepaymentOut(id=r["id"], due_date=r["due_date"], amount=r["amount"], status=r["status"])
            for r in (res.data or [])
        ]
    except Exception as e:
        logger.warning("Failed to fetch repayments for %s: %s", application_id, e)
        return []


async def apply_for_offer(user_id: str, offer_id: str, *, idempotency_key: str) -> LoanApplicationOut:
    supabase = get_supabase()
    offer_row: dict | None = None
    if supabase is not None:
        try:
            res = (
                supabase.table("loan_offers")
                .select("*")
                .eq("id", offer_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            offer_row = res.data if res else None
        except Exception as e:
            logger.warning("Failed to fetch loan offer %s for %s: %s", offer_id, user_id, e)

    if offer_row is None:
        raise ValueError("Offer not found or expired")

    # Retrying with the same idempotency key must return the existing
    # application, not mint a duplicate with a fresh id + repayment set.
    if supabase is not None:
        existing = await _fetch_application_by_idempotency_key(supabase, offer_id, idempotency_key)
        if existing is not None:
            return await get_application(user_id, existing["id"]) or LoanApplicationOut(
                id=existing["id"],
                offer_id=offer_id,
                status=existing["status"],
                partner_reference=existing["partner_reference"],
                submitted_at=existing["submitted_at"],
                decision_at=existing.get("decision_at"),
                repayments=await _fetch_repayments(supabase, existing["id"]),
            )

    if offer_row.get("status") != "offered":
        raise ValueError("Offer is no longer available")
    expires_at = _parse_datetime(offer_row.get("expires_at"))
    if expires_at is not None and expires_at < datetime.now(timezone.utc):
        raise ValueError("Offer has expired")

    result = await _adapter.submit_application(offer_id, user_id, idempotency_key=idempotency_key)
    now = datetime.now(timezone.utc)

    total_repayable = _total_repayable(
        float(offer_row["amount"]), float(offer_row["apr"]), int(offer_row["tenure_months"])
    )
    repayments = _build_repayment_schedule(total_repayable, int(offer_row["tenure_months"]), now.date())

    # Sync the live decision immediately so the caller doesn't see a stale
    # "submitted" status when the mock partner has already auto-approved.
    live_status = await _adapter.get_application_status(result.partner_reference)
    status: ApplicationStatus = live_status  # type: ignore[assignment]

    application_id = str(uuid.uuid4())

    if supabase is not None:
        try:
            supabase.table("loan_applications").upsert(
                {
                    "id": application_id,
                    "offer_id": offer_id,
                    "user_id": user_id,
                    "status": status,
                    "idempotency_key": idempotency_key,
                    "partner_reference": result.partner_reference,
                    "submitted_at": now.isoformat(),
                    "decision_at": now.isoformat() if status != "submitted" else None,
                },
                on_conflict="offer_id,idempotency_key",
            ).execute()
            supabase.table("loan_offers").update({"status": "applied"}).eq("id", offer_id).execute()
            for r in repayments:
                supabase.table("repayments").insert({**r, "application_id": application_id}).execute()
        except Exception as e:
            logger.exception("Failed to persist loan application for %s", user_id)
            raise RuntimeError("Could not save the application — please try again") from e

    return LoanApplicationOut(
        id=application_id,
        offer_id=offer_id,
        status=status,
        partner_reference=result.partner_reference,
        submitted_at=now,
        decision_at=now if status != "submitted" else None,
        repayments=[RepaymentOut(id=f"{application_id}-{i}", **r) for i, r in enumerate(repayments)],
    )


async def get_application(user_id: str, application_id: str) -> LoanApplicationOut | None:
    supabase = get_supabase()
    if supabase is None:
        return None
    try:
        app_res = (
            supabase.table("loan_applications")
            .select("*")
            .eq("id", application_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not app_res or not app_res.data:
            return None
        row = app_res.data

        live_status = await _adapter.get_application_status(row["partner_reference"])
        if live_status != row.get("status"):
            supabase.table("loan_applications").update(
                {"status": live_status, "decision_at": datetime.now(timezone.utc).isoformat()}
            ).eq("id", application_id).execute()
            row["status"] = live_status

        repayments = await _fetch_repayments(supabase, application_id)

        return LoanApplicationOut(
            id=row["id"],
            offer_id=row["offer_id"],
            status=row["status"],
            partner_reference=row["partner_reference"],
            submitted_at=row["submitted_at"],
            decision_at=row.get("decision_at"),
            repayments=repayments,
        )
    except Exception as e:
        logger.warning("Failed to fetch loan application %s for %s: %s", application_id, user_id, e)
        return None
