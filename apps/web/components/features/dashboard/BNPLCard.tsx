"use client";

import { formatRM } from "@/lib/utils";

const MOCK_BNPL = [
  { provider: "Shopee PayLater", monthly: 89, remaining: 3 },
  { provider: "Grab PayLater", monthly: 45, remaining: 5 },
];

export function BNPLCard() {
  const totalMonthly = MOCK_BNPL.reduce((s, b) => s + b.monthly, 0);

  return (
    <div className="rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          💳 BNPL Commitments
        </h2>
        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
          {formatRM(totalMonthly)}/mo
        </span>
      </div>
      <div className="space-y-2">
        {MOCK_BNPL.map((b) => (
          <div
            key={b.provider}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-amber-700 dark:text-amber-300">{b.provider}</span>
            <span className="text-amber-600 dark:text-amber-400 text-xs">
              {formatRM(b.monthly)} × {b.remaining}mo left
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
        ⚠️ BNPL is factored into every spend check.
      </p>
    </div>
  );
}
