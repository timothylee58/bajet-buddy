"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PetNudge } from "@/types";
import { MOOD_EMOJI } from "./petConfig";

interface PetSpeechBubbleProps {
  nudge: PetNudge | null;
  visible: boolean;
  onDismiss: () => void;
  side?: "left" | "right";
}

export function PetSpeechBubble({ nudge, visible, onDismiss, side = "left" }: PetSpeechBubbleProps) {
  if (!nudge) return null;
  const moodColor: Record<string, string> = {
    happy:       "from-emerald-50 to-white border-emerald-200",
    celebrating: "from-amber-50 to-white border-amber-300",
    worried:     "from-orange-50 to-white border-orange-200",
    warning:     "from-red-50 to-white border-red-300",
    sleepy:      "from-slate-50 to-white border-slate-200",
    neutral:     "from-indigo-50 to-white border-indigo-200",
  };
  const colors = moodColor[nudge.mood] ?? moodColor.neutral;
  const tailClass = side === "left"
    ? "after:absolute after:bottom-[-8px] after:right-4 after:border-4 after:border-transparent after:border-t-white"
    : "after:absolute after:bottom-[-8px] after:left-4 after:border-4 after:border-transparent after:border-t-white";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`relative max-w-[220px] bg-gradient-to-br ${colors} border rounded-2xl px-4 py-3 shadow-lg ${tailClass}`}
          role="status"
          aria-live="polite"
        >
          <button
            onClick={onDismiss}
            className="absolute top-1 right-2 text-zinc-400 hover:text-zinc-600 text-xs leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <p className="text-xs font-medium text-zinc-800 pr-4 leading-relaxed">
            {MOOD_EMOJI[nudge.mood]} {nudge.message}
          </p>
          {nudge.xp_hint !== null && nudge.xp_hint !== undefined && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
              +{nudge.xp_hint} XP
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
