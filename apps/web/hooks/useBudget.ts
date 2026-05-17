"use client";

import { useState, useEffect, useMemo } from "react";
import { getBudgetSummary } from "@/lib/api";
import { useGuestMode } from "@/hooks/useGuestMode";
import type { BudgetSummary } from "@/types";

const MOCK_SUMMARY: BudgetSummary = {
  total_income: 3200,
  total_spent: 2860,
  remaining: 340,
  days_left: 7,
  daily_safe_amount: 48.57,
};

export function useBudget() {
  const [fetchedSummary, setFetchedSummary] = useState<BudgetSummary | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { isGuest, guestData } = useGuestMode();

  const guestSummary = useMemo<BudgetSummary | null>(() => {
    if (!isGuest || !guestData.estimated_budget) return null;
    const totalSpent = guestData.transactions.reduce(
      (acc, t) => acc + ((t.amount as number) || 0),
      0
    );
    const estimatedTotal = guestData.estimated_budget.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    return {
      total_income: estimatedTotal + 500,
      total_spent: totalSpent,
      remaining: estimatedTotal - totalSpent,
      days_left: 30,
      daily_safe_amount: (estimatedTotal - totalSpent) / 30,
    };
  }, [isGuest, guestData.estimated_budget, guestData.transactions]);

  useEffect(() => {
    if (guestSummary) return;

    getBudgetSummary()
      .then((data) => setFetchedSummary(data as BudgetSummary))
      .catch(() => {
        setFetchedSummary(MOCK_SUMMARY);
      })
      .finally(() => setFetchLoading(false));
  }, [guestSummary]);

  const summary = guestSummary ?? fetchedSummary;
  const loading = guestSummary ? false : fetchLoading;

  return { summary, loading, error: null };
}
