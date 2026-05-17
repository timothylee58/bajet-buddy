"use client";

import { formatRM, clamp } from "@/lib/utils";

const MOCK_CATEGORIES = [
  { name: "Food & Drinks", emoji: "🍜", spent: 680, allocated: 800, color: "#BA6200" },
  { name: "Transport", emoji: "🚗", spent: 320, allocated: 400, color: "#D97706" },
  { name: "Shopping", emoji: "🛍️", spent: 950, allocated: 600, color: "#dc2626" },
  { name: "Entertainment", emoji: "🎮", spent: 180, allocated: 200, color: "#944E00" },
  { name: "Utilities", emoji: "💡", spent: 210, allocated: 250, color: "#F59E0B" },
];

export function CategoryBars() {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Categories
      </h2>
      {MOCK_CATEGORIES.map((cat) => {
        const pct = clamp((cat.spent / cat.allocated) * 100, 0, 100);
        const over = cat.spent > cat.allocated;
        return (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">
                {cat.emoji} {cat.name}
              </span>
              <span
                className={`text-xs font-medium ${
                  over ? "text-red-500" : "text-zinc-500"
                }`}
              >
                {formatRM(cat.spent)} / {formatRM(cat.allocated)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: over ? "#dc2626" : cat.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
