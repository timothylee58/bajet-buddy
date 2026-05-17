"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PetAccessory } from "@/types";

interface PetLevelUpToastProps {
  level: number | null;
  onDismiss: () => void;
}

interface AccessoryToastProps {
  accessory: PetAccessory | null;
  onDismiss: () => void;
}

export function PetLevelUpToast({ level, onDismiss }: PetLevelUpToastProps) {
  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 to-yellow-300 text-zinc-900 rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center gap-1 text-center"
        >
          <span className="text-3xl">🎉</span>
          <p className="font-extrabold text-lg">Level Up!</p>
          <p className="text-sm font-medium">Your buddy reached Level {level}!</p>
          <button
            onClick={onDismiss}
            className="mt-2 text-xs underline text-zinc-700"
          >
            Nice!
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AccessoryUnlockToast({ accessory, onDismiss }: AccessoryToastProps) {
  return (
    <AnimatePresence>
      {accessory && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center gap-1 text-center"
        >
          <span className="text-3xl">{accessory.emoji}</span>
          <p className="font-extrabold text-sm">New Accessory Unlocked!</p>
          <p className="text-xs opacity-90">{accessory.name}</p>
          <p className="text-[10px] opacity-75 max-w-[160px]">{accessory.description}</p>
          <button onClick={onDismiss} className="mt-2 text-xs underline opacity-80">
            Awesome!
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
