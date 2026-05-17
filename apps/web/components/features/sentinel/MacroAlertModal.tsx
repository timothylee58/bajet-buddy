"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatRM } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SimulateEventResponse } from "@/types";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
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
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white pt-4 pb-2 px-5 flex justify-between items-center border-b border-zinc-100 z-20">
              <div className="flex items-center gap-2">
                <span className="text-4xl">{impact.impact.persona_emoji}</span>
                <div>
                  <div className="font-bold text-zinc-800">{impact.impact.persona_name}</div>
                  <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium", SEVERITY_COLORS[impact.impact.severity_label] ?? "bg-zinc-100 text-zinc-600")}>
                    {impact.impact.severity_label}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl font-bold">✕</button>
            </div>

            <div className="px-5 pt-4 space-y-4">
              <div>
                <div className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
                  {impact.impact.ai_intervention_bm}
                </div>
              </div>

              <div className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                {impact.impact.ai_intervention_body}
              </div>

              <div>
                <div className="text-xs font-semibold text-zinc-500 mb-2">Category Impacts</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {impact.impact.category_impacts.map((ci) => (
                    <div
                      key={ci.category}
                      className="flex-shrink-0 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 min-w-[120px]"
                    >
                      <div className="text-xs font-semibold text-zinc-700 mb-1">
                        {CATEGORY_LABELS[ci.category] ?? ci.category}
                      </div>
                      <div className="text-sm font-bold text-red-600">+{formatRM(ci.estimated_increase_rm)}</div>
                      <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium mt-1 inline-block", ci.estimated_increase_pct > 20 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        +{ci.estimated_increase_pct.toFixed(1)}%
                      </span>
                      {ci.affected_merchants.slice(0, 2).map((m) => (
                        <div key={m} className="text-xs text-zinc-400 truncate">{m}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <div className="text-xs text-red-500 font-medium mb-1">Estimated Monthly Impact</div>
                <div className="text-3xl font-extrabold text-red-600">+{formatRM(impact.impact.total_monthly_impact_rm)}</div>
              </div>

              {impact.quests_generated.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-2">Quests Unlocked</div>
                  <div className="flex flex-col gap-2">
                    {impact.quests_generated.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                        <span className="text-xl">{q.badge_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-700 truncate">{q.title}</div>
                          <div className="text-xs text-zinc-400">{q.title_bm}</div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">+{q.xp_reward} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="bg-emerald-500 text-white rounded-2xl p-4 text-center font-extrabold text-2xl"
              >
                +{impact.xp_awarded} XP
              </motion.div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-zinc-700 to-zinc-900"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
