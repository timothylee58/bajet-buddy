"use client";

import { motion } from "framer-motion";

interface Props {
  heat: number;
  mood: string;
}

const LEVELS = [
  { max: 20, label: "Chill", emoji: "🧘", color: "bg-emerald-500", glow: "rgba(16,185,129,0.4)" },
  { max: 40, label: "Warm", emoji: "🙂", color: "bg-lime-500", glow: "rgba(132,204,22,0.4)" },
  { max: 60, label: "Cautious", emoji: "⚠️", color: "bg-amber-500", glow: "rgba(245,158,11,0.5)" },
  { max: 80, label: "Alert", emoji: "🚨", color: "bg-orange-500", glow: "rgba(249,115,22,0.5)" },
  { max: 101, label: "Crisis", emoji: "💥", color: "bg-red-600", glow: "rgba(220,38,38,0.6)" },
];

function getLevel(heat: number) {
  return LEVELS.find((l) => heat < l.max) ?? LEVELS[LEVELS.length - 1];
}

export function SentinelHeatBar({ heat, mood }: Props) {
  const level = getLevel(heat);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/80 border border-zinc-200/60 p-5 shadow-sm">
      {/* Glow ring */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-30 blur-xl"
        style={{ backgroundColor: level.glow }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{level.emoji}</span>
            <div>
              <p className="text-sm font-bold text-zinc-800">{level.label}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Market Pulse</p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">{mood}</span>
        </div>

        {/* Heat bar */}
        <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${level.color} relative`}
            initial={{ width: 0 }}
            animate={{ width: `${heat}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* Shimmer — animated with framer-motion */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-zinc-400">Cool</span>
          <span className="text-xs font-bold text-zinc-600">{heat}%</span>
          <span className="text-[10px] text-zinc-400">Crisis</span>
        </div>
      </div>
    </div>
  );
}
