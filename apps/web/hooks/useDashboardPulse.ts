"use client";

import { useEffect, useMemo, useState } from "react";
import { getBudgetSummary } from "@/lib/api";
import { useFreeze } from "./useFreeze";
import { useGamification } from "./useGamification";
import { useGuestMode } from "./useGuestMode";
import type { BudgetSummary } from "@/types";

const DEFAULT_BUDGET: BudgetSummary = {
  total_income: 3200,
  total_spent: 2860,
  remaining: 340,
  days_left: 7,
  daily_safe_amount: 48.57,
};

export function useDashboardPulse() {
  const [budget, setBudget] = useState<BudgetSummary>(DEFAULT_BUDGET);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isGuest, guestData } = useGuestMode();
  const freeze = useFreeze();
  const gamification = useGamification();
  const refreshFreeze = freeze.refresh;
  const refreshGamification = gamification.refresh;

  useEffect(() => {
    let active = true;

    async function refreshBudget() {
      if (isGuest && guestData.estimated_budget) {
        const totalSpent = guestData.transactions.reduce((acc, t) => acc + t.amount, 0);
        const estimatedTotal = guestData.estimated_budget.reduce((acc: number, item: any) => acc + item.amount, 0);
        
        setBudget({
          total_income: estimatedTotal + 500,
          total_spent: totalSpent,
          remaining: estimatedTotal - totalSpent,
          days_left: 30,
          daily_safe_amount: (estimatedTotal - totalSpent) / 30,
        });
        setLoadingBudget(false);
        setLastUpdated(new Date());
        return;
      }

      setLoadingBudget(true);
      setBudgetError(null);
      try {
        const data = await getBudgetSummary();
        if (!active) return;
        setBudget(data as BudgetSummary);
      } catch (err) {
        if (!active) return;
        setBudgetError(err instanceof Error ? err.message : "Unable to load budget summary");
      } finally {
        if (!active) return;
        setLoadingBudget(false);
        setLastUpdated(new Date());
      }
    }

    void refreshBudget();
    const intervalId = window.setInterval(() => {
      void refreshBudget();
      void refreshFreeze();
      void refreshGamification();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [refreshFreeze, refreshGamification]);

  return useMemo(
    () => ({
      budget,
      freeze: freeze.status,
      gamification: gamification.status,
      loading: loadingBudget || freeze.loading || gamification.loading,
      lastUpdated,
      errors: [budgetError, freeze.error, gamification.error].filter(Boolean) as string[],
    }),
    [
      budget,
      budgetError,
      freeze.error,
      freeze.loading,
      freeze.status,
      gamification.error,
      gamification.loading,
      gamification.status,
      lastUpdated,
      loadingBudget,
    ]
  );
}
