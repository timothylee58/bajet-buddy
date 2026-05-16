"use client";

import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  joined: boolean;
}

export function ChallengeCard({
  title,
  description,
  participants,
  daysLeft,
  joined,
}: ChallengeCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        joined
          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {title}
            </h3>
            {joined && (
              <span className="text-xs bg-green-600 text-white rounded-full px-2 py-0.5 font-medium">
                Joined ✓
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
          <div className="flex gap-4 mt-2 text-xs text-zinc-400">
            <span>👥 {participants} participants</span>
            <span>⏳ {daysLeft} days left</span>
          </div>
        </div>

        {!joined && (
          <button className="flex-shrink-0 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 transition-colors">
            Join
          </button>
        )}
      </div>
    </div>
  );
}
