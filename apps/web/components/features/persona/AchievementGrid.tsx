"use client";

import { cn } from "@/lib/utils";

const ACHIEVEMENTS = [
  { id: "first_check", emoji: "🎯", name: "First Check", unlocked: true },
  { id: "streak_3", emoji: "🔥", name: "3-Day Streak", unlocked: true },
  { id: "streak_7", emoji: "🔥🔥", name: "7-Day Streak", unlocked: true },
  { id: "no_shopee", emoji: "🛍️", name: "No Shopee Week", unlocked: false },
  { id: "saver_100", emoji: "💰", name: "Saved RM100", unlocked: false },
  { id: "budget_master", emoji: "👑", name: "Budget Master", unlocked: false },
  { id: "social_buddy", emoji: "👥", name: "Social Buddy", unlocked: false },
  { id: "legend", emoji: "🏆", name: "BajetBuddy Legend", unlocked: false },
];

export function AchievementGrid() {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
        Achievements
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {ACHIEVEMENTS.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-opacity",
              a.unlocked ? "opacity-100" : "opacity-30 grayscale"
            )}
            title={a.name}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="text-[10px] text-zinc-500 leading-tight">{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
