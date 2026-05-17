"use client";

import { motion } from "framer-motion";
import { Flame, Zap, TrendingUp, Award } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

export function ProfileHeader() {
  const { status, loading } = useGamification();

  if (loading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-primary to-amber-500 p-5 animate-pulse chunky-shadow h-40" />
    );
  }

  const pct = Math.round(status.progress_pct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-amber-500 p-5 text-white chunky-shadow"
    >
      {/* decorative orbs */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/8 blur-2xl" />

      <div className="relative">
        {/* Level + streak row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
              Level {status.level}
            </p>
            <h2 className="font-headline text-2xl font-bold leading-tight">
              {status.level_name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-white/15 border border-white/20 px-3 py-1.5">
            <Flame className="w-4 h-4 text-amber-300" />
            <span className="font-headline text-sm font-bold text-white">
              {status.streak}d
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-sans text-xs font-semibold text-white/80">
                {status.xp.toLocaleString()} XP
              </span>
            </div>
            <span className="font-headline text-xs font-bold text-white/90">
              {pct}%
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            />
          </div>

          <p className="font-sans text-[10px] text-white/50">
            {(status.xp_to_next - status.xp).toLocaleString()} XP to next level
          </p>
        </div>

        {/* Mini stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Award, label: "Badges", value: "3" },
            { icon: TrendingUp, label: "Level", value: String(status.level) },
            { icon: Flame, label: "Best streak", value: `${status.streak}d` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/10 border border-white/10 px-2 py-1.5 text-center">
              <p className="font-headline text-sm font-bold text-white">{value}</p>
              <p className="font-sans text-[9px] text-white/50 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
