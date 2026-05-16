"use client";

import { clamp } from "@/lib/utils";

interface StreakXPBarProps {
  streak: number;
  xp: number;
  level: number;
  maxXP: number;
}

export function StreakXPBar({ streak, xp, level, maxXP }: StreakXPBarProps) {
  const pct = clamp((xp / maxXP) * 100, 0, 100);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 px-4 py-3">
      {/* Streak */}
      <div className="flex flex-col items-center min-w-[48px]">
        <span className="text-2xl leading-none">🔥</span>
        <span className="text-xs font-bold text-orange-500 mt-0.5">
          {streak}d
        </span>
      </div>

      {/* XP bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-green-700 dark:text-green-300">
            Level {level}
          </span>
          <span className="text-xs text-zinc-500">
            {xp} / {maxXP} XP
          </span>
        </div>
        <div className="h-2 rounded-full bg-green-200 dark:bg-green-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
