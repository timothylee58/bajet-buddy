"use client";

import { cn } from "@/lib/utils";
import { useBuddies } from "@/hooks/useBuddies";
import { Card } from "@/components/ui/card";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function ConnectionsList() {
  const { leaderboard, loading } = useBuddies();

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Connections</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Weekly</span>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
              entry.is_me
                ? "bg-green-50 border border-green-200 shadow-sm ring-1 ring-green-100"
                : "bg-white border border-gray-100 shadow-sm"
            )}
          >
            <span className="text-lg w-6 text-center shrink-0" aria-hidden="true">
              {RANK_MEDALS[entry.rank] ?? <span className="text-xs text-gray-400 font-bold">{entry.rank}</span>}
            </span>
            <span className="text-2xl shrink-0" aria-hidden="true">{entry.avatar_emoji}</span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-bold truncate",
                  entry.is_me ? "text-green-800" : "text-gray-800"
                )}
              >
                {entry.display_name} {entry.is_me && "(You)"}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-orange-600 font-medium">🔥 {entry.streak}d streak</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-primary">
                {entry.xp} <span className="text-[10px] uppercase font-bold text-gray-400">XP</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
