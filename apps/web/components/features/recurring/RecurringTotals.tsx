"use client";

import { Wallet } from "lucide-react";
import type { RecurringSummary } from "@/types";

interface RecurringTotalsProps {
  summary: RecurringSummary;
}

export function RecurringTotals({ summary }: RecurringTotalsProps) {
  return (
    <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-tertiary-light flex items-center justify-center flex-shrink-0">
          <Wallet className="w-6 h-6 text-tertiary-dark" />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-xs text-muted uppercase">Locked in every month</p>
          <p className="font-headline text-2xl font-bold text-foreground">
            RM{summary.total_monthly_rm.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-muted px-3 py-2">
          <p className="font-sans text-xs text-muted">Per year</p>
          <p className="font-headline text-base font-bold text-foreground">
            RM{summary.total_annual_rm.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-muted px-3 py-2">
          <p className="font-sans text-xs text-muted">Of your income</p>
          <p className="font-headline text-base font-bold text-foreground">
            {summary.pct_of_income == null ? "—" : `${summary.pct_of_income.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <p className="mt-4 font-sans text-sm text-foreground">{summary.insight}</p>
    </section>
  );
}
