"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { VERDICT_CONFIG } from "@/lib/constants";
import { formatRM } from "@/lib/utils";
import type { CheckResponse } from "@/types";
import { FOMONegotiatorModal } from "@/components/features/fomo/FOMONegotiatorModal";

interface VerdictOverlayProps {
  result: CheckResponse;
  amount: number;
  onReset: () => void;
}

export function VerdictOverlay({ result, amount, onReset }: VerdictOverlayProps) {
  const cfg = VERDICT_CONFIG[result.verdict];
  const [fomoOpen, setFomoOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      data-testid="verdict-overlay"
      className={`flex flex-col gap-5 rounded-3xl border p-6 ${cfg.bg} ${cfg.border}`}
    >
      {/* Verdict badge */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-6xl mb-2"
          aria-hidden="true"
        >
          {cfg.emoji}
        </motion.div>
        <h2 data-testid="verdict-label" className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</h2>
        <p className="text-sm text-zinc-500 mt-1">{cfg.labelEN}</p>
      </div>

      {/* Amount */}
      <div className="text-center">
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatRM(amount)}
        </span>
      </div>

      {/* Nudge — BM first */}
      <div className={`rounded-2xl bg-white/70 dark:bg-zinc-900/50 p-4 border ${cfg.border}`}>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
          {result.nudge_bm}
        </p>
        <p data-testid="verdict-nudge-en" className="text-xs text-zinc-400 mt-2 leading-relaxed italic">
          {result.nudge_en}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex justify-around text-center">
        <div>
          <p className="text-xs text-zinc-400">Risk Score</p>
          <p className={`text-lg font-bold ${cfg.color}`}>{result.risk_score}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Budget Impact</p>
          <p className={`text-lg font-bold ${cfg.color}`}>
            {result.budget_impact_pct.toFixed(0)}%
          </p>
        </div>
        {result.xp_earned > 0 && (
          <div>
            <p className="text-xs text-zinc-400">XP Earned</p>
            <p className="text-lg font-bold text-green-600">+{result.xp_earned}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {result.verdict === "jangan_dulu" && (
          <button
            onClick={() => setFomoOpen(true)}
            className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            🧠 Negotiate with FOMO Negotiator
          </button>
        )}
        <div className="flex gap-2">
          {result.verdict === "jangan_dulu" && (
            <button
              data-testid="save-to-wishlist-button"
              className="flex-1 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              💾 Wishlist
            </button>
          )}
          <button
            onClick={onReset}
            data-testid="check-another-button"
            className="flex-1 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Check Another
          </button>
        </div>
      </div>

      <FOMONegotiatorModal
        open={fomoOpen}
        request={fomoOpen ? { amount, item_name: "Purchase", merchant: "Unknown", category: "general" } : null}
        onClose={() => setFomoOpen(false)}
      />
    </motion.div>
  );
}
