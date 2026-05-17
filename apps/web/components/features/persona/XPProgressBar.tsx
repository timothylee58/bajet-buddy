"use client";

import { clamp } from "@/lib/utils";
import { LEVELS } from "@/lib/constants";

interface XPProgressBarProps {
  current: number;
  max: number;
  level: number;
}

export function XPProgressBar({ current, max, level }: XPProgressBarProps) {
  const pct = clamp((current / max) * 100, 0, 100);
  const levelInfo = LEVELS.find((l) => l.level === level);
  const nextLevel = LEVELS.find((l) => l.level === level + 1);

  return (
    <div className="rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/30">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {levelInfo?.name ?? `Level ${level}`}
          </span>
          {nextLevel && (
            <span className="text-xs text-emerald-600/60 ml-2">
              → {nextLevel.name}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-emerald-700/70">
          {current} / {max} XP
        </span>
      </div>

      <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${current} of ${max} XP`}
        />
      </div>

      <p className="text-xs text-emerald-600/60 mt-2">
        {max - current} XP to next level 🚀
      </p>
    </div>
  );
}
