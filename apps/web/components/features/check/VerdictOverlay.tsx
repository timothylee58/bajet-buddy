"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { VERDICT_CONFIG } from "@/lib/constants";
import { formatRM } from "@/lib/utils";
import type { CheckResponse } from "@/types";
import { FOMONegotiatorModal } from "@/components/features/fomo/FOMONegotiatorModal";
import { usePet } from "@/components/features/pet/PetCompanionProvider";

interface VerdictOverlayProps {
  result: CheckResponse;
  amount: number;
  onReset: () => void;
}

export function VerdictOverlay({ result, amount, onReset }: VerdictOverlayProps) {
  const cfg = VERDICT_CONFIG[result.verdict];
  const [fomoOpen, setFomoOpen] = useState(false);
  const { award, refresh } = usePet();
  const bridgedRef = useRef(false);

  useEffect(() => {
    if (bridgedRef.current) return;
    bridgedRef.current = true;
    const event = result.verdict === "boleh" ? "budget_under"
      : result.verdict === "jangan_dulu" ? "impulse_blocked"
      : null;
    if (event) {
      award({ event, amount_rm: amount });
    }
    const context = result.verdict === "boleh" ? "under_budget"
      : result.verdict === "jangan_dulu" ? "impulse_spend"
      : "dashboard_open";
    refresh(context, amount);
  }, [result.verdict, amount, award, refresh]);

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
        <p className="text-sm text-muted mt-1">{cfg.labelEN}</p>
      </div>

      {/* Amount */}
      <div className="text-center">
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatRM(amount)}
        </span>
      </div>

      {/* Nudge — BM first */}
      <div className={`rounded-2xl bg-white p-4 border ${cfg.border}`}>
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {result.nudge_bm}
        </p>
        <p data-testid="verdict-nudge-en" className="text-xs text-muted mt-2 leading-relaxed italic">
          {result.nudge_en}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex justify-around text-center">
        <div>
          <p className="text-xs text-muted">Risk Score</p>
          <p className={`text-lg font-bold ${cfg.color}`}>{result.risk_score}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Budget Impact</p>
          <p className={`text-lg font-bold ${cfg.color}`}>
            {result.budget_impact_pct.toFixed(0)}%
          </p>
        </div>
        {result.xp_earned > 0 && (
          <div>
            <p className="text-xs text-muted">XP Earned</p>
            <p className="text-lg font-bold text-primary">+{result.xp_earned}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {result.verdict === "jangan_dulu" && (
          <button
            onClick={() => setFomoOpen(true)}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            🧠 Negotiate with FOMO Negotiator
          </button>
        )}
        <div className="flex gap-2">
          {result.verdict === "jangan_dulu" && (
            <button
              data-testid="save-to-wishlist-button"
              className="flex-1 rounded-2xl bg-white border border-border py-3 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors"
            >
              💾 Wishlist
            </button>
          )}
          <button
            onClick={onReset}
            data-testid="check-another-button"
            className="flex-1 rounded-2xl bg-neutral-dark text-white py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
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
