"use client";

import { useState, useEffect } from "react";
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
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGuest, guestData } = useGuestMode();

  useEffect(() => {
    if (isGuest && guestData.estimated_budget) {
      const totalSpent = guestData.transactions.reduce((acc, t) => acc + t.amount, 0);
      const estimatedTotal = guestData.estimated_budget.reduce((acc: number, item: any) => acc + item.amount, 0);
      
      setSummary({
        total_income: estimatedTotal + 500, // assume some buffer
        total_spent: totalSpent,
        remaining: estimatedTotal - totalSpent,
        days_left: 30, // assume month start
        daily_safe_amount: (estimatedTotal - totalSpent) / 30,
      });
      setLoading(false);
      return;
    }

    getBudgetSummary()
      .then((data) => setSummary(data as BudgetSummary))
      .catch(() => {
        // Fall back to mock data when backend is unavailable
        setSummary(MOCK_SUMMARY);
      })
      .finally(() => setLoading(false));
  }, [isGuest, guestData]);

  return { summary, loading, error: null };
}
