"use client";

import { motion } from "framer-motion";

interface PersonaCardProps {
  name: string;
  emoji: string;
  description: string;
  level: number;
  confidence: number;
  explanation: string;
  suggestedInterventionRule: string;
}

export function PersonaCard({
  name,
  emoji,
  description,
  level,
  confidence,
  explanation,
  suggestedInterventionRule,
}: PersonaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-emerald-500/15 bg-[#071412] p-6 text-white shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="text-5xl" aria-hidden="true">{emoji}</div>
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{name}</h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
                {confidence}% confidence
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
              Lv.{level}
              </span>
            </div>
            <p className="text-sm text-emerald-100 leading-relaxed">{description}</p>
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                Persona Explanation
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                {explanation}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
                Suggested Intervention Rule
              </p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                {suggestedInterventionRule}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
