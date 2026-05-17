"use client";

import { motion } from "framer-motion";
import type { MacroEvent } from "@/types";

interface Props {
  event: MacroEvent;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActiveEventBanner({ event }: Props) {
  const isHigh = event.severity >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl p-5 border-2"
      style={{
        borderColor: isHigh ? "#ef4444" : "#f59e0b",
        backgroundColor: isHigh ? "#fef2f2" : "#fffbeb",
      }}
    >
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{
          background: isHigh
            ? "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.15), transparent 70%)"
            : "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.15), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-start gap-3">
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {event.icon}
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-bold ${isHigh ? "text-red-600" : "text-amber-700"}`}>
              {event.title_bm}
            </span>
            <span className="text-[10px] text-zinc-400 bg-white/80 rounded-full px-1.5 py-0.5">
              {relativeTime(event.triggered_at)}
            </span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">{event.description}</p>

          {/* Severity bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">Severity</span>
              <span className={`font-bold ${isHigh ? "text-red-500" : "text-amber-600"}`}>
                {event.severity}/10
              </span>
            </div>
            <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isHigh ? "bg-red-500" : "bg-amber-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${(event.severity / 10) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
