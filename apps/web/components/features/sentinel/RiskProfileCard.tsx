"use client";

import { motion } from "framer-motion";
import type { RiskLabel, RiskProfile, RiskProfileType } from "@bajetbuddy/shared";
import { RISK_PROFILE_META } from "@/lib/sentinel/engine";
import { GlassCard } from "./GlassCard";

const LABEL_TO_PROFILE_TYPE: Record<RiskLabel, RiskProfileType> = {
  "Grocery-Sensitive": "grocery_sensitive",
  "Fuel-Sensitive": "fuel_sensitive",
  "Vulnerable Consumer": "vulnerable_consumer",
  "Food-Delivery Dependent": "delivery_sensitive",
  "Entertainment Spender": "balanced",
  "Resilient Saver": "balanced",
};

interface RiskProfileCardProps {
  profile: RiskProfile | RiskProfileType;
}

export function RiskProfileCard({ profile }: RiskProfileCardProps) {
  const profileType: RiskProfileType =
    typeof profile === "string"
      ? profile
      : LABEL_TO_PROFILE_TYPE[profile.primary_label] ?? "balanced";

  const meta = RISK_PROFILE_META[profileType];

  return (
    <GlassCard glow="brand" className="overflow-hidden p-0">
      <RiskProfileInner meta={meta} />
    </GlassCard>
  );
}

function RiskProfileInner({
  meta,
}: {
  meta: (typeof RISK_PROFILE_META)[RiskProfileType];
}) {
  return (
    <div className={`bg-gradient-to-br ${meta.color} p-5 text-white`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">
            Risk profile
          </p>
          <h2 className="mt-1 text-2xl font-bold">{meta.label}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{meta.blurb}</p>
        </div>
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="text-5xl"
          aria-hidden
        >
          {meta.emoji}
        </motion.span>
      </motion.div>
    </div>
  );
}
