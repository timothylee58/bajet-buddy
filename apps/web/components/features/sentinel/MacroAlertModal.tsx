"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatRM } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { X, TrendingUp, Shield, Gift, ArrowRight } from "lucide-react";
import type { SimulateEventResponse } from "@/types";

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Low:    { bg: "bg-emerald-50",   text: "text-emerald-700",   border: "border-emerald-200",   icon: "🟢" },
  Medium: { bg: "bg-amber-50",     text: "text-amber-700",     border: "border-amber-200",     icon: "🟡" },
  High:   { bg: "bg-orange-50",    text: "text-orange-700",    border: "border-orange-200",    icon: "🟠" },
  Critical:{ bg: "bg-red-50",      text: "text-red-700",       border: "border-red-200",       icon: "🔴" },
};

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "Groceries", fuel: "Fuel", food_delivery: "Food Delivery",
  entertainment: "Entertainment", transport: "Transport", utilities: "Utilities",
};

interface Props {
  impact: SimulateEventResponse | null;
  open: boolean;
  onClose: () => void;
}

export function MacroAlertModal({ impact, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && impact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 pt-5 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl">{impact.impact.persona_emoji}</span>
                <div>
                  <div className="font-bold text-white text-lg">{impact.impact.persona_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-white/70">
                      {SEVERITY_STYLES[impact.impact.severity_label]?.icon ?? ""} {impact.impact.severity_label} severity
                    </span>
                  </div>
                </div>
              </div>

              {/* Impact headline */}
              <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
                <p className="text-sm font-bold text-white leading-snug">
                  {impact.impact.ai_intervention_bm}
                </p>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Body text */}
              <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {impact.impact.ai_intervention_body}
              </div>

              {/* Category impacts */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Price Impact by Category
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {impact.impact.category_impacts.map((ci) => (
                    <div
                      key={ci.category}
                      className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3"
                    >
                      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                        {CATEGORY_LABELS[ci.category] ?? ci.category}
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-red-600">+{formatRM(ci.estimated_increase_rm)}</span>
                        <span className={cn(
                          "text-xs font-medium",
                          ci.estimated_increase_pct > 20 ? "text-red-500" : "text-amber-500"
                        )}>
                          (+{ci.estimated_increase_pct.toFixed(0)}%)
                        </span>
                      </div>
                      {ci.affected_merchants.length > 0 && (
                        <div className="text-[10px] text-zinc-400 mt-1 truncate">
                          {ci.affected_merchants.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total impact */}
              <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30 border border-red-200 dark:border-red-800/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-red-600 dark:text-red-400">Monthly Impact</div>
                    <div className="text-2xl font-extrabold text-red-700 dark:text-red-400">
                      +{formatRM(impact.impact.total_monthly_impact_rm)}
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="bg-emerald-500 text-white rounded-xl px-4 py-2 text-center"
                  >
                    <div className="text-[10px] font-semibold opacity-80">Earned</div>
                    <div className="text-lg font-extrabold">+{impact.xp_awarded} XP</div>
                  </motion.div>
                </div>
              </div>

              {/* Quests */}
              {impact.quests_generated.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                    <Shield className="w-3 h-3" />
                    Inflation Shield Quests
                  </div>
                  <div className="space-y-2">
                    {impact.quests_generated.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/30 rounded-xl px-3 py-2.5"
                      >
                        <span className="text-2xl">{q.badge_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 truncate">{q.title}</div>
                          <div className="text-xs text-indigo-500 dark:text-indigo-400">{q.title_bm}</div>
                        </div>
                        <span className="shrink-0 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                          <Gift className="w-3 h-3 inline mr-0.5" />+{q.xp_reward}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-5 py-3">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2"
              >
                I understand, let&apos;s fight this!
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
