"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OverspentCardsProps {
  used: number;
  max?: number;
  taxModeActive: boolean;
}

export function OverspentCards({ used, max = 3, taxModeActive }: OverspentCardsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Overspent Cards
        </span>
        {taxModeActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
            💸 Tax Mode ON
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const burned = i < used;
          return (
            <motion.div
              key={i}
              initial={burned ? { scale: 1 } : { scale: 0.9, opacity: 0.4 }}
              animate={burned ? { scale: [1, 1.1, 1] } : { scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border-2 py-3 text-xl transition-all",
                burned
                  ? "border-red-400 bg-red-50 shadow-sm"
                  : "border-dashed border-zinc-300 bg-zinc-50"
              )}
              title={burned ? "Card burned" : "Card available"}
            >
              {burned ? "🔥" : "🃏"}
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-400 text-center">
        {used < max
          ? `${max - used} card${max - used !== 1 ? "s" : ""} left — use wisely!`
          : "All cards burned — Tax Mode activated on next spend"}
      </p>
    </div>
  );
}
