"use client";

import { motion } from "framer-motion";
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

const SENSITIVITY_COLORS = [
  { max: 40, color: "bg-emerald-400", label: "Low" },
  { max: 70, color: "bg-amber-400", label: "Med" },
  { max: 101, color: "bg-red-400", label: "High" },
];

function getSensitivity(s: number) {
  return SENSITIVITY_COLORS.find((l) => s < l.max) ?? SENSITIVITY_COLORS[SENSITIVITY_COLORS.length - 1];
}

interface Props {
  snapshot: SpendingSnapshot;
  isHighlighted: boolean;
}

export function SpendingCategoryCard({ snapshot, isHighlighted }: Props) {
  const icon = CATEGORY_ICONS[snapshot.category] ?? "💰";
  const label = CATEGORY_LABELS[snapshot.category] ?? snapshot.category;
  const sens = getSensitivity(snapshot.sensitivity_score);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="rounded-2xl bg-white/80 border border-zinc-200/60 p-4 shadow-sm flex flex-col gap-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-xs font-bold text-zinc-700">{label}</span>
        </div>
        {isHighlighted && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full animate-pulse">
            HIGH
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="flex items-end justify-between">
        <span className="text-xl font-extrabold text-zinc-800">{formatRM(snapshot.total_rm)}</span>
        <span className="text-[10px] text-zinc-400">{snapshot.transaction_count} txns</span>
      </div>

      {/* Top merchant */}
      <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-50 rounded-full px-2 py-1">
        <span>🏪</span>
        <span className="truncate">{snapshot.top_merchant}</span>
      </div>

      {/* Sensitivity bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-400">Sensitivity</span>
          <span className="font-semibold text-zinc-500">{sens.label}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${sens.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${snapshot.sensitivity_score}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      {/* % of spend */}
      <div className="text-[10px] text-zinc-400 text-right">
        {snapshot.pct_of_spend.toFixed(1)}% of total spend
      </div>
    </motion.div>
  );
}
