"use client";

import { cn } from "@/lib/utils";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Amirah R.", emoji: "👸", xp: 980, streak: 14, isMe: false },
  { rank: 2, name: "You (Sarah)", emoji: "😊", xp: 420, streak: 7, isMe: true },
  { rank: 3, name: "Hafiz K.", emoji: "🧑", xp: 390, streak: 5, isMe: false },
  { rank: 4, name: "Nurul A.", emoji: "👩", xp: 310, streak: 3, isMe: false },
  { rank: 5, name: "Danial M.", emoji: "🧔", xp: 280, streak: 2, isMe: false },
];

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function Leaderboard() {
  return (
    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
        Weekly Leaderboard
      </h2>
      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              entry.isMe
                ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                : "bg-white dark:bg-zinc-900"
            )}
          >
            <span className="text-lg w-6 text-center" aria-hidden="true">
              {RANK_MEDALS[entry.rank] ?? `#${entry.rank}`}
            </span>
            <span className="text-xl" aria-hidden="true">{entry.emoji}</span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  entry.isMe ? "text-green-700 dark:text-green-300" : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {entry.name}
              </p>
              <p className="text-xs text-zinc-400">🔥 {entry.streak}d streak</p>
            </div>
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
              {entry.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
