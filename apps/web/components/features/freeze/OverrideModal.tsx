"use client";

import { motion } from "framer-motion";

interface OverrideModalProps {
  xpCost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OverrideModal({ xpCost, onConfirm, onCancel }: OverrideModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-title"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-10"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
          <h2
            id="override-title"
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            Emergency Override
          </h2>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            This will unfreeze your account and cost you{" "}
            <strong className="text-red-500">{xpCost} XP</strong>. Are you sure
            this is an emergency?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold py-3 text-sm transition-colors"
          >
            Yes, override (−{xpCost} XP)
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold py-3 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel — stay frozen
          </button>
        </div>
      </motion.div>
    </div>
  );
}
