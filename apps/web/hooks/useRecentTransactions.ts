"use client";

import { useState, useEffect } from "react";
import { getTransactions } from "@/lib/api";
import type { Transaction } from "@/types";

export function useRecentTransactions(limit = 3) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getTransactions()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? (data as Transaction[]) : [];
        setTransactions(list.slice(0, limit));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load transactions");
        setTransactions([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit]);

  return { transactions, loading, error };
}
