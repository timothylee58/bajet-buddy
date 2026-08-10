"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { cn, formatRM } from "@/lib/utils";
import type { LoanApplication } from "@/types";

const STATUS_LABEL: Record<LoanApplication["status"], string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  disbursed: "Disbursed",
  closed: "Closed",
};

const STATUS_COLOR: Record<LoanApplication["status"], string> = {
  submitted: "bg-surface-muted text-muted",
  approved: "bg-tertiary-light text-tertiary-dark",
  rejected: "bg-danger/10 text-danger",
  disbursed: "bg-primary-light text-primary-dark",
  closed: "bg-surface-muted text-muted",
};

interface ApplicationStatusProps {
  application: LoanApplication;
}

export function ApplicationStatus({ application }: ApplicationStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-border p-5 chunky-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
            STATUS_COLOR[application.status]
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          {STATUS_LABEL[application.status]}
        </span>
        <span className="font-sans text-[10px] text-muted">Ref: {application.partner_reference.slice(0, 12)}</span>
      </div>

      {application.repayments.length > 0 && (
        <div className="space-y-2">
          <p className="font-sans text-xs font-bold text-muted uppercase">Repayment Schedule</p>
          {application.repayments.map((repayment) => (
            <div
              key={repayment.id}
              className="flex items-center justify-between bg-surface-muted rounded-xl px-3 py-2"
            >
              <span className="flex items-center gap-2 font-sans text-xs text-foreground">
                <Clock className="w-3 h-3 text-muted" />
                {repayment.due_date}
              </span>
              <span className="font-headline text-sm font-bold text-foreground">
                {formatRM(repayment.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
