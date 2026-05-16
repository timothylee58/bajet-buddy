"use client";

import { cn, formatRM, clamp } from "@/lib/utils";

interface BudgetRingProps {
  spent: number;
  total: number;
  currency?: string;
}

export function BudgetRing({ spent, total }: BudgetRingProps) {
  const pct = clamp((spent / total) * 100, 0, 100);
  const remaining = total - spent;

  // SVG circle math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const ringColor =
    pct >= 90 ? "#dc2626" : pct >= 70 ? "#d97706" : "#16a34a";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-6">
      <div className="relative w-44 h-44">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 160 160"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="14"
          />
          {/* Progress */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-zinc-400 font-medium">Remaining</span>
          <span
            className={cn(
              "text-2xl font-bold",
              pct >= 90
                ? "text-red-500"
                : pct >= 70
                ? "text-amber-500"
                : "text-green-600"
            )}
          >
            {formatRM(remaining)}
          </span>
          <span className="text-xs text-zinc-400">of {formatRM(total)}</span>
        </div>
      </div>

      <div className="flex gap-6 text-center">
        <div>
          <p className="text-xs text-zinc-400">Spent</p>
          <p className="text-sm font-semibold">{formatRM(spent)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Budget</p>
          <p className="text-sm font-semibold">{formatRM(total)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Used</p>
          <p className="text-sm font-semibold">{pct.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
