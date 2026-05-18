"use client";

import { clamp, formatRM } from "@/lib/utils";

interface BudgetImpactBarProps {
  amount: number;
  remaining: number;
}

export function BudgetImpactBar({ amount, remaining }: BudgetImpactBarProps) {
  const pct = clamp((amount / remaining) * 100, 0, 100);
  const afterSpend = remaining - amount;
  const color =
    pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="rounded-xl bg-surface-muted px-4 py-3">
      <div className="flex justify-between text-xs text-muted mb-1.5">
        <span>Budget impact</span>
        <span>
          {formatRM(remaining)} → {afterSpend > 0 ? formatRM(afterSpend) : "⚠️ Over"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-1">
        This spend uses <strong>{pct.toFixed(0)}%</strong> of your remaining budget.
      </p>
    </div>
  );
}
