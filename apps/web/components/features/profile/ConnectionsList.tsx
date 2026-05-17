"use client";

import { cn } from "@/lib/utils";
import { useBuddies } from "@/hooks/useBuddies";
import { motion } from "framer-motion";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function ConnectionsList() {
  const { leaderboard, loading } = useBuddies();

  if (loading) {
    return (
      <div className="space-y-2.5 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {leaderboard.map((entry, idx) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.2 }}
          className={cn(
            "flex items-center gap-3 rounded-2xl border-b-[3px] px-4 py-3 transition-all",
            entry.is_me
              ? "bg-primary-light border-primary/30 shadow-sm"
              : "bg-white border-zinc-100 shadow-sm"
          )}
        >
          {/* Rank */}
          <span className="text-lg w-7 text-center shrink-0 font-headline font-bold">
            {RANK_MEDALS[entry.rank] ?? (
              <span className="text-sm text-muted">{entry.rank}</span>
            )}
          </span>

          {/* Avatar */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
            entry.is_me ? "bg-primary/15" : "bg-zinc-100"
          )}>
            {entry.avatar_emoji}
          </div>

          {/* Name + streak */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-headline text-sm font-bold truncate leading-tight",
              entry.is_me ? "text-primary-dark" : "text-foreground"
            )}>
              {entry.display_name}
              {entry.is_me && (
                <span className="ml-1.5 font-sans text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full uppercase">
                  You
                </span>
              )}
            </p>
            <p className="font-sans text-[11px] text-muted mt-0.5">
              🔥 <span className="font-bold text-tertiary">{entry.streak}d</span> streak
            </p>
          </div>

          {/* XP */}
          <div className="text-right shrink-0">
            <p className={cn(
              "font-headline text-base font-bold",
              entry.is_me ? "text-primary" : "text-foreground"
            )}>
              {entry.xp.toLocaleString()}
            </p>
            <p className="font-sans text-[9px] uppercase tracking-wider text-muted font-bold">XP</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
