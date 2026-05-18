"use client";

import { motion } from "framer-motion";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function DailyLogin() {
  const { status, loading } = useGamification();

  if (loading) return null;

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  return (
    <div className="rounded-2xl border-b-4 border-primary/20 bg-white chunky-shadow p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-headline text-base font-bold text-foreground">Weekly Streak</h3>
          <p className="font-sans text-xs text-muted">Check in daily to keep it alive</p>
        </div>
        <span className="font-headline text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full">
          🔥 {status.streak}d
        </span>
      </div>

      {/* Day pills */}
      <div className="flex justify-between gap-1.5">
        {DAYS.map((day, i) => {
          const isPast = i < todayIdx;
          const isToday = i === todayIdx;
          const future = i > todayIdx;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                initial={isToday ? { scale: 0.8 } : {}}
                animate={isToday ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                  isToday
                    ? "bg-primary text-white shadow-md shadow-primary/30 scale-110"
                    : isPast && i < todayIdx
                    ? "bg-primary-light text-primary"
                    : "bg-zinc-100 text-zinc-300 border border-zinc-100"
                )}
              >
                {isToday ? "🔥" : isPast ? "✅" : future ? "💎" : "💎"}
              </motion.div>
              <span className={cn(
                "font-sans text-[10px] font-bold",
                isToday ? "text-primary" : isPast ? "text-zinc-400" : "text-zinc-200"
              )}>
                {day}
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-sans text-[11px] text-muted mt-3 text-center">
        Log in every day to earn your{" "}
        <span className="font-bold text-primary">streak bonus XP!</span>
      </p>
    </div>
  );
}
