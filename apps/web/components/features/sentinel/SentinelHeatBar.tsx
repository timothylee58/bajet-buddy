"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  heat: number;
  mood: string;
}

function getMoodLabel(heat: number): string {
  if (heat < 30) return "🧘 Calm";
  if (heat < 60) return "⚠️ Cautious";
  if (heat < 80) return "🚨 Alert";
  return "💥 Crisis";
}

function getBarColor(heat: number): string {
  if (heat < 30) return "bg-emerald-500";
  if (heat < 60) return "bg-amber-500";
  if (heat < 80) return "bg-orange-500";
  return "bg-red-500";
}

export function SentinelHeatBar({ heat, mood }: Props) {
  const moodLabel = getMoodLabel(heat);
  const barColor = getBarColor(heat);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-indigo-700">Market Pulse</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{mood}</span>
          <span className="text-sm font-bold text-indigo-800">{moodLabel}</span>
        </div>
      </div>
      <div className="h-3 w-full bg-indigo-100 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${heat}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-zinc-400">0</span>
        <span className="text-xs font-medium text-zinc-600">Heat: {heat}/100</span>
        <span className="text-xs text-zinc-400">100</span>
      </div>
    </div>
  );
}
