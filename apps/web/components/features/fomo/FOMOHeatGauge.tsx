"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FOMOHeatGaugeProps {
  level: number;
  delta?: number;
}

function getHeatConfig(level: number) {
  if (level >= 80) return { label: "FOMO FEVER 🔥", color: "bg-red-500", textColor: "text-red-600", bg: "bg-red-50 border-red-200" };
  if (level >= 60) return { label: "Getting Hot 🌶️", color: "bg-orange-400", textColor: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  if (level >= 40) return { label: "Warming Up ⚠️", color: "bg-amber-400", textColor: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  return { label: "Cool Head 🧊", color: "bg-emerald-500", textColor: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
}

export function FOMOHeatGauge({ level, delta }: FOMOHeatGaugeProps) {
  const cfg = getHeatConfig(level);

  return (
    <div className={cn("rounded-2xl border p-3 space-y-2", cfg.bg)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">FOMO Heat Gauge</span>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && delta !== 0 && (
            <motion.span
              initial={{ opacity: 0, y: delta > 0 ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("text-[11px] font-bold", delta > 0 ? "text-red-500" : "text-emerald-600")}
            >
              {delta > 0 ? `+${delta}` : delta}
            </motion.span>
          )}
          <span className={cn("text-sm font-bold", cfg.textColor)}>{cfg.label}</span>
        </div>
      </div>
      <div className="h-3 rounded-full bg-white/60 overflow-hidden border border-white/40">
        <motion.div
          className={cn("h-full rounded-full", cfg.color)}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>🧊 Chill</span>
        <span>{level.toFixed(0)}%</span>
        <span>🔥 Fever</span>
      </div>
    </div>
  );
}
