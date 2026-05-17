"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatRM } from "@/lib/utils";
import type { SpendingSnapshot } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  groceries: "🛒",
  fuel: "⛽",
  food_delivery: "🛵",
  entertainment: "🎬",
  transport: "🚗",
  utilities: "💡",
};

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "Groceries",
  fuel: "Fuel",
  food_delivery: "Food Delivery",
  entertainment: "Entertainment",
  transport: "Transport",
  utilities: "Utilities",
};

interface Props {
  snapshot: SpendingSnapshot;
  isHighlighted: boolean;
}

export function SpendingCategoryCard({ snapshot, isHighlighted }: Props) {
  const icon = CATEGORY_ICONS[snapshot.category] ?? "💰";
  const label = CATEGORY_LABELS[snapshot.category] ?? snapshot.category;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-3 flex flex-col gap-2",
        isHighlighted && "ring-2 ring-red-400 animate-pulse"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold text-zinc-600 leading-tight">{label}</span>
      </div>
      <div className="text-lg font-bold text-zinc-800">{formatRM(snapshot.total_rm)}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{snapshot.pct_of_spend.toFixed(1)}% of spend</span>
        <span className="text-xs text-zinc-400">{snapshot.transaction_count} txns</span>
      </div>
      <div className="bg-zinc-100 rounded-full px-2 py-0.5 text-xs text-zinc-500 truncate">
        {snapshot.top_merchant}
      </div>
      <div>
        <div className="text-xs text-zinc-400 mb-1">Sensitivity</div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              snapshot.sensitivity_score < 40
                ? "bg-emerald-400"
                : snapshot.sensitivity_score < 70
                ? "bg-amber-400"
                : "bg-red-400"
            )}
            style={{ width: `${snapshot.sensitivity_score}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
