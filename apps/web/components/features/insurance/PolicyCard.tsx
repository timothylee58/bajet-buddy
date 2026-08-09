"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { formatRM } from "@/lib/utils";
import type { InsurancePolicy } from "@/types";

const PRODUCT_LABELS: Record<InsurancePolicy["product_type"], string> = {
  bnpl_default_protection: "BNPL Default Protection",
  purchase_protection: "Purchase Protection",
};

const STATUS_COLOR: Record<InsurancePolicy["status"], string> = {
  active: "bg-tertiary-light text-tertiary-dark",
  expired: "bg-surface-muted text-muted",
  claimed: "bg-primary-light text-primary-dark",
  cancelled: "bg-surface-muted text-muted",
};

interface PolicyCardProps {
  policy: InsurancePolicy;
}

// Mirrors OfferCard's layout for consistency across the two embedded-finance
// surfaces — same rounded-2xl/border/chunky-shadow card shape.
export function PolicyCard({ policy }: PolicyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-tertiary/20 p-5 chunky-shadow"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-light px-3 py-1 text-xs font-bold text-tertiary-dark">
          <ShieldCheck className="w-3 h-3" />
          {PRODUCT_LABELS[policy.product_type]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLOR[policy.status]}`}
        >
          {policy.status}
        </span>
      </div>

      <p className="font-headline text-2xl font-bold text-foreground mt-2">
        {formatRM(policy.coverage_amount)} covered
      </p>
      <p className="font-sans text-xs text-muted mt-1">
        {formatRM(policy.premium)} premium · {policy.partner_name}
      </p>
      <p className="font-sans text-[10px] text-muted mt-2">
        {new Date(policy.starts_at).toLocaleDateString("en-MY")} –{" "}
        {new Date(policy.ends_at).toLocaleDateString("en-MY")}
      </p>
    </motion.div>
  );
}
