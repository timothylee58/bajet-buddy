"use client";

import { useState, useEffect } from "react";
import { getTransactions } from "@/lib/api";
import type { Transaction } from "@/types";

export function useRecentTransactions(limit = 3) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTransactions()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? (data as Transaction[]) : [];
        setTransactions(list.slice(0, limit));
      })
      .catch(() => {
        if (!active) return;
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

  return { transactions, loading };
}
