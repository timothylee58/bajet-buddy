"use client";

import { motion } from "framer-motion";

interface TaxModePanelProps {
  active: boolean;
  taxRate: number;
  taxAmount: number | null;
}

export function TaxModePanel({ active, taxRate, taxAmount }: TaxModePanelProps) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-2xl border border-red-200 bg-red-50"
    >
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">💸</span>
          <p className="text-sm font-bold text-red-700">Tax Mode Active</p>
        </div>
        <p className="text-xs text-red-600 leading-5">
          You&apos;ve burned all 3 cards. {taxRate}% of each spend now auto-transfers to your savings goal until next salary cycle.
        </p>
        {taxAmount !== null && (
          <p className="text-sm font-semibold text-red-700 mt-2">
            RM {taxAmount.toFixed(2)} will go to savings on this purchase.
          </p>
        )}
      </div>
    </motion.div>
  );
}
