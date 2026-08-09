"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getInsuranceQuote, purchaseInsurance } from "@/lib/api";
import { formatRM } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import type { InsuranceQuote, Verdict } from "@/types";

interface InsuranceNudgeProps {
  verdict: Verdict;
  amount: number;
}

// Renders INSIDE VerdictOverlay, below the primary verdict content — footnote
// weight only (smaller type, muted color), so it never competes visually
// with the verdict itself. Fires its own POST /api/insurance/quote after
// mount, non-blocking relative to the /api/check call that already happened.
export function InsuranceNudge({ verdict, amount }: InsuranceNudgeProps) {
  const [quote, setQuote] = useState<InsuranceQuote | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (verdict === "jangan_dulu") return;
    let active = true;
    getInsuranceQuote({ verdict, amount })
      .then((data) => {
        if (active) setQuote(data);
      })
      .catch(() => {
        // silent — a missing footnote nudge is a fine failure mode
      });
    return () => {
      active = false;
    };
  }, [verdict, amount]);

  if (verdict === "jangan_dulu" || !quote || dismissed) return null;

  async function handlePurchase() {
    if (!quote) return;
    setPurchasing(true);
    try {
      await purchaseInsurance({
        product_type: quote.product_type,
        premium: quote.premium,
        coverage_amount: quote.coverage_amount,
      });
      setPurchased(true);
      success("Coverage added");
    } catch (err) {
      console.error("Failed to purchase insurance:", err);
      toastError("Could not add coverage. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        data-testid="insurance-nudge"
        className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted border border-border/50 px-3 py-2"
      >
        <p className="text-[11px] text-muted leading-snug flex-1">
          {purchased ? (
            "Covered — " + quote.pitch
          ) : (
            <>
              {quote.pitch} <span className="font-semibold">{formatRM(quote.premium)}</span>
              {quote.product_type === "purchase_protection" ? "" : "/mo"} via Etiqa (mock).
            </>
          )}
        </p>
        {!purchased && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              data-testid="insurance-nudge-add"
              className="text-[11px] font-semibold text-muted underline hover:text-foreground transition-colors disabled:opacity-50"
            >
              {purchasing ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
