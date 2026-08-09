"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { formatRM } from "@/lib/utils";
import type { LoanOffer } from "@/types";

const PRODUCT_LABELS: Record<LoanOffer["product_type"], string> = {
  salary_advance: "Salary Advance",
  bnpl_consolidation: "BNPL Consolidation",
  micro_personal: "Personal Financing",
};

interface OfferCardProps {
  offer: LoanOffer;
  onApply: (offerId: string) => void;
  applying?: boolean;
}

// Never red/alarming — offers use primary/tertiary tokens only, styled like
// VerdictOverlay's own card conventions (rounded-2xl, border, chunky-shadow).
export function OfferCard({ offer, onApply, applying = false }: OfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-tertiary/20 p-5 chunky-shadow"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-light px-3 py-1 text-xs font-bold text-tertiary-dark">
          <Sparkles className="w-3 h-3" />
          {PRODUCT_LABELS[offer.product_type]}
        </span>
        <span className="font-sans text-xs text-muted">{offer.partner_name}</span>
      </div>

      <p className="font-headline text-3xl font-bold text-foreground mt-2">{formatRM(offer.amount)}</p>
      <p className="font-sans text-sm text-muted mt-1">{offer.reason}</p>

      {/* Amount, APR, tenure, total repayable — in that order, no fine print below the fold */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-surface-muted rounded-xl p-2 text-center">
          <p className="font-sans text-[10px] text-muted uppercase">APR</p>
          <p className="font-headline text-sm font-bold text-foreground">{offer.apr.toFixed(1)}%</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-2 text-center">
          <p className="font-sans text-[10px] text-muted uppercase">Tenure</p>
          <p className="font-headline text-sm font-bold text-foreground">{offer.tenure_months} mo</p>
        </div>
        <div className="bg-tertiary-light rounded-xl p-2 text-center">
          <p className="font-sans text-[10px] text-tertiary-dark uppercase">Total Repayable</p>
          <p className="font-headline text-sm font-bold text-tertiary-dark">
            {formatRM(offer.total_repayable)}
          </p>
        </div>
      </div>

      <button
        onClick={() => onApply(offer.id)}
        disabled={applying}
        data-testid="apply-offer-button"
        className="w-full mt-4 rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {applying ? "Submitting…" : "Apply"}
      </button>

      <p className="font-sans text-[10px] text-muted text-center mt-2">
        Referred to {offer.partner_name} — BajetBuddy does not lend or hold your funds.
      </p>
    </motion.div>
  );
}
