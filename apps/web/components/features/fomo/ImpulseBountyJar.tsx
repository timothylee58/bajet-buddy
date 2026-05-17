"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImpulseBountyJarProps {
  amountRm: number;
  thresholdRm?: number;
  earnedRm?: number;
  lootUnlocked?: boolean;
}

export function ImpulseBountyJar({
  amountRm,
  thresholdRm = 50,
  earnedRm,
  lootUnlocked = false,
}: ImpulseBountyJarProps) {
  const pct = Math.min((amountRm / thresholdRm) * 100, 100);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🫙</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Impulse Bounty Jar</span>
        </div>
        {earnedRm !== undefined && earnedRm > 0 && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-bold text-emerald-600"
          >
            +RM{earnedRm.toFixed(2)} earned!
          </motion.span>
        )}
      </div>

      <div className="h-2.5 rounded-full bg-emerald-200 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-emerald-700 font-semibold">RM{amountRm.toFixed(2)}</span>
        <span className="text-zinc-400">→ RM{thresholdRm} = 🎁 Loot Box</span>
      </div>

      {lootUnlocked && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-xs font-bold text-white"
        >
          🎁 LOOT BOX UNLOCKED — collect from Agents page!
        </motion.div>
      )}

      <p className={cn("text-[10px] text-center", lootUnlocked ? "text-emerald-600" : "text-zinc-400")}>
        {lootUnlocked
          ? "Discipline pays off — literally 💚"
          : `Walk away from purchases to fill the jar. Every RM${thresholdRm} = one loot box.`}
      </p>
    </div>
  );
}
