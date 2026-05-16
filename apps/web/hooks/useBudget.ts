"use client";

import { useState, useEffect } from "react";
import { getBudgetSummary } from "@/lib/api";
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

  useEffect(() => {
    getBudgetSummary()
      .then((data) => setSummary(data as BudgetSummary))
      .catch(() => {
        // Fall back to mock data when backend is unavailable
        setSummary(MOCK_SUMMARY);
      })
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error: null };
}
