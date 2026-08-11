"use client";

import { AlertTriangle, CalendarClock, Repeat } from "lucide-react";
import type { RecurringCadence, RecurringSubscription } from "@/types";

const CADENCE_LABEL: Record<RecurringCadence, string> = {
  weekly: "Every week",
  fortnightly: "Every 2 weeks",
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
};

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

interface SubscriptionCardProps {
  subscription: RecurringSubscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const lowConfidence = subscription.confidence < 60;

  return (
    <article className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-lg font-bold text-foreground truncate">
            {subscription.merchant}
          </h3>
          <p className="font-sans text-xs text-muted capitalize">{subscription.category}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-headline text-lg font-bold text-primary">
            RM{subscription.average_amount_rm.toFixed(2)}
          </p>
          <p className="font-sans text-xs text-muted">
            RM{subscription.monthly_cost_rm.toFixed(2)}/mo
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1 font-sans text-xs text-muted">
          <Repeat className="w-3.5 h-3.5" />
          {CADENCE_LABEL[subscription.cadence]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1 font-sans text-xs text-muted">
          <CalendarClock className="w-3.5 h-3.5" />
          {subscription.is_overdue ? "Was due" : "Next"} {formatDate(subscription.next_expected_at)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
        <p className="font-sans text-xs text-muted">
          {subscription.occurrences} charges seen · RM
          {subscription.annual_cost_rm.toFixed(2)} a year
        </p>
        {lowConfidence && (
          <span className="inline-flex items-center gap-1 font-sans text-xs text-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            Might not be a subscription
          </span>
        )}
      </div>
    </article>
  );
}
