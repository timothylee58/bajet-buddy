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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 border-2 border-amber-400 bg-amber-50"
      style={{
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{event.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-bold ${isHigh ? "text-red-600" : "text-amber-700"}`}>
              {event.title_bm}
            </span>
            <span className="text-xs text-zinc-400">{relativeTime(event.triggered_at)}</span>
          </div>
          <p className="text-xs text-zinc-600 line-clamp-2">{event.description}</p>
          <div className="mt-2 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isHigh ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${(event.severity / 10) * 100}%` }}
            />
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">Severity: {event.severity}/10</div>
        </div>
      </div>
    </motion.div>
  );
}
