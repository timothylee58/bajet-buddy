"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RiskProfile, RiskLabel } from "@/types";

const LABEL_COLORS: Record<RiskLabel, string> = {
  "Grocery-Sensitive": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Fuel-Sensitive": "bg-orange-100 text-orange-700 border-orange-200",
  "Vulnerable Consumer": "bg-red-100 text-red-700 border-red-200 animate-pulse",
  "Food-Delivery Dependent": "bg-violet-100 text-violet-700 border-violet-200",
  "Entertainment Spender": "bg-blue-100 text-blue-700 border-blue-200",
  "Resilient Saver": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface Props {
  profile: RiskProfile;
}

export function RiskProfileCard({ profile }: Props) {
  const score = profile.vulnerability_score;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-5"
    >
      <div className="text-sm font-semibold text-zinc-500 mb-3">Risk Profile</div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#f4f4f5" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={score > 60 ? "#ef4444" : score > 40 ? "#f59e0b" : "#10b981"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-zinc-700">{score}</span>
          </div>
        </div>
        <div>
          <span
            className={cn(
              "inline-block border rounded-full px-3 py-1 text-sm font-bold mb-2",
              LABEL_COLORS[profile.primary_label]
            )}
          >
            {profile.primary_label}
          </span>
          <div className="text-xs text-zinc-500">Most exposed: <span className="font-medium text-zinc-700">{profile.most_exposed_category}</span></div>
        </div>
      </div>

      {profile.secondary_labels.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-zinc-400 mb-1">Also at risk</div>
          <div className="flex flex-wrap gap-1">
            {profile.secondary_labels.map((label) => (
              <span
                key={label}
                className={cn("border rounded-full px-2 py-0.5 text-xs", LABEL_COLORS[label])}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.top_risk_merchants.length > 0 && (
        <div>
          <div className="text-xs text-zinc-400 mb-1">Top risk merchants</div>
          <div className="flex flex-wrap gap-1">
            {profile.top_risk_merchants.map((m) => (
              <span key={m} className="bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 text-xs">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
