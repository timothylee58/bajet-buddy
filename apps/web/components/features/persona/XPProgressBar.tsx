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
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {levelInfo?.name ?? `Level ${level}`}
          </span>
          {nextLevel && (
            <span className="text-xs text-zinc-400 ml-2">
              → {nextLevel.name}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-zinc-500">
          {current} / {max} XP
        </span>
      </div>

      <div className="h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${current} of ${max} XP`}
        />
      </div>

      <p className="text-xs text-zinc-400 mt-2">
        {max - current} XP to next level 🚀
      </p>
    </div>
  );
}
