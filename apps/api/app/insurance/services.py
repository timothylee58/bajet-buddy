"""Insurance orchestration — contextual nudges (P13). Never inline in the
/api/check hot path: the frontend fires POST /api/insurance/quote as a
separate, non-blocking request after the verdict renders.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from app.core.cache import cache_get, cache_set
from app.core.database import get_supabase
from app.insurance.partner_adapters.base import InsurancePartnerAdapter
from app.insurance.partner_adapters.mock_etiqa_adapter import MockEtiqaAdapter
from app.insurance.schemas import InsurancePolicyOut, InsuranceQuoteResponse
from app.risk_engine.credit_score import _fetch_bnpl_outstanding

logger = logging.getLogger(__name__)

_adapter: InsurancePartnerAdapter = MockEtiqaAdapter()

PURCHASE_PROTECTION_MIN_AMOUNT = 50.0
BNPL_PROTECTION_DEDUP_DAYS = 30
POLICY_TENURE_DAYS = {"bnpl_default_protection": 30, "purchase_protection": 90}


def _bnpl_dedup_key(user_id: str) -> str:
    return f"insurance_bnpl_offer:{user_id}"


async def _has_active_bnpl_protection(user_id: str) -> bool:
    supabase = get_supabase()
    if supabase is None:
        return False
    try:
        res = (
            supabase.table("insurance_policies")
            .select("id")
            .eq("user_id", user_id)
            .eq("product_type", "bnpl_default_protection")
            .eq("status", "active")
            .execute()
        )
        return bool(res.data)
    except Exception as e:
        logger.warning("Failed to check active BNPL protection for %s: %s", user_id, e)
        return False


async def get_contextual_offer(
    user_id: str, verdict: str, amount: float
) -> InsuranceQuoteResponse | None:
    # Never on jangan_dulu — insurance must not read as profiting from stress.
    if verdict == "jangan_dulu":
        return None

    bnpl_outstanding = await _fetch_bnpl_outstanding(user_id)
    if bnpl_outstanding > 0:
        dedup_key = _bnpl_dedup_key(user_id)
        already_offered_recently = await cache_get(dedup_key)
        has_policy = await _has_active_bnpl_protection(user_id)
        if not already_offered_recently and not has_policy:
            quote = await _adapter.quote("bnpl_default_protection", bnpl_outstanding)
            await cache_set(dedup_key, "1", ttl=BNPL_PROTECTION_DEDUP_DAYS * 24 * 60 * 60)
            return InsuranceQuoteResponse(
                product_type="bnpl_default_protection",
                partner_name=quote.partner_name,
                premium=quote.premium,
                coverage_amount=quote.coverage_amount,
                pitch=quote.pitch,
            )

    if amount > PURCHASE_PROTECTION_MIN_AMOUNT:
        quote = await _adapter.quote("purchase_protection", amount)
        return InsuranceQuoteResponse(
            product_type="purchase_protection",
            partner_name=quote.partner_name,
            premium=quote.premium,
            coverage_amount=quote.coverage_amount,
            pitch=quote.pitch,
        )

    return None


async def purchase_policy(
    user_id: str,
    product_type: str,
    premium: float,
    coverage_amount: float,
    linked_transaction_id: str | None,
) -> InsurancePolicyOut:
    idempotency_key = f"{user_id}:{product_type}:{coverage_amount}"
    result = await _adapter.issue_policy(
        product_type, premium, coverage_amount, idempotency_key=idempotency_key
    )
    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(days=POLICY_TENURE_DAYS.get(product_type, 30))
    policy_id = str(uuid.uuid4())

    supabase = get_supabase()
    if supabase is not None:
        try:
            supabase.table("insurance_policies").insert(
                {
                    "id": policy_id,
                    "user_id": user_id,
                    "product_type": product_type,
                    "premium": premium,
                    "coverage_amount": coverage_amount,
                    "linked_transaction_id": linked_transaction_id,
                    "status": result.status,
                    "starts_at": now.isoformat(),
                    "ends_at": ends_at.isoformat(),
                }
            ).execute()
        except Exception as e:
            # A write-path failure must not be reported as success — unlike
            # the read-path graceful degradation used elsewhere in this
            # codebase, silently returning an unsaved policy here would lie
            # about coverage actually existing.
            logger.error("Failed to persist insurance policy for %s: %s", user_id, e)
            raise RuntimeError("Could not save the policy — please try again") from e

    return InsurancePolicyOut(
        id=policy_id,
        product_type=product_type,
        partner_name="Etiqa (mock)",
        premium=premium,
        coverage_amount=coverage_amount,
        status=result.status,
        starts_at=now,
        ends_at=ends_at,
    )


async def get_policies(user_id: str) -> list[InsurancePolicyOut]:
    supabase = get_supabase()
    if supabase is None:
        return []
    try:
        res = (
            supabase.table("insurance_policies")
            .select("*")
            .eq("user_id", user_id)
            .order("starts_at", desc=True)
            .execute()
        )
        return [
            InsurancePolicyOut(
                id=row["id"],
                product_type=row["product_type"],
                partner_name=row["partner_name"],
                premium=row["premium"],
                coverage_amount=row["coverage_amount"],
                status=row["status"],
                starts_at=row["starts_at"],
                ends_at=row["ends_at"],
            )
            for row in (res.data or [])
        ]
    except Exception as e:
        logger.warning("Failed to fetch insurance policies for %s: %s", user_id, e)
        return []
