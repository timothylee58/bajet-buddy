"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PwaReportResponse } from "@/lib/api";

interface PwaLockdownOverlayProps {
  lockdown: PwaReportResponse | null;
  onDismiss: () => void;
}

export function PwaLockdownOverlay({ lockdown, onDismiss }: PwaLockdownOverlayProps) {
  if (!lockdown) return null;

  const lockedUntil = lockdown.locked_until
    ? new Date(lockdown.locked_until).toLocaleTimeString("en-MY", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "later";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-red-950/95 backdrop-blur-md p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Red danger header */}
          <div className="bg-red-600 px-6 pt-6 pb-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
            >
              <Lock className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">App Locked</h2>
            <p className="text-sm text-red-200 mt-1">
              BNPL Monitor triggered — spending locked
            </p>
          </div>

          {/* Message body */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <p className="text-sm text-red-800 leading-6 whitespace-pre-line">
                {lockdown.message}
              </p>
            </div>

            {/* Cooldown indicator */}
            {lockdown.locked_until && (
              <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3">
                <Timer className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-600">
                  Locked until <span className="font-semibold">{lockedUntil}</span>
                </span>
              </div>
            )}

            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className={cn(
                "w-full rounded-2xl py-3.5 text-sm font-bold transition-all",
                "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
                "shadow-lg shadow-red-500/25"
              )}
            >
              I Understand — Close Shopee/Lazada
            </button>

            <p className="text-center text-[11px] text-zinc-400">
              This lock will lift automatically after 30 minutes.
              You made a promise to yourself — BajetBuddy is just keeping it.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
