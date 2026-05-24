"use client";

import { useState } from "react";

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  note?: string;
  created_at: string;
}

interface UseOptimisticExpensesOptions {
  onError?: (message: string) => void;
}

export function useOptimisticExpenses(
  apiPost: (expense: Omit<Expense, "id" | "created_at">) => Promise<Expense>,
  options: UseOptimisticExpensesOptions = {}
) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function handleAddExpense(newExpense: Omit<Expense, "id" | "created_at">) {
    const optimisticEntry: Expense = {
      ...newExpense,
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const previous = expenses;
    setExpenses((prev: Expense[]) => [optimisticEntry, ...prev]);

    try {
      const saved = await apiPost(newExpense);
      setExpenses((prev: Expense[]) =>
        prev.map((e: Expense) => (e.id === optimisticEntry.id ? saved : e))
      );
    } catch (err) {
      setExpenses(previous);
      const message = err instanceof Error ? err.message : "Failed to save expense";
      options.onError?.(message);
    }
  }

  return { expenses, setExpenses, handleAddExpense };
}
