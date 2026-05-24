"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { PersonaType } from "@/types";

const PERSONA_MASCOTS: Partial<Record<PersonaType, string>> = {
  midnight_shopee_queen: "/pets/Shopee Queen.png",
};

const PERSONA_GRADIENTS: Partial<Record<PersonaType, string>> = {
  midnight_shopee_queen: "from-[#2D1B69] via-[#4A2D8A] to-[#7C5CFF]",
  gaji_habis_king:       "from-[#1A2E1A] via-[#1E4620] to-[#16a34a]",
  bubble_tea_bro:        "from-[#2D1020] via-[#5C1A3A] to-[#BE185D]",
  mamak_lepak_spender:   "from-[#2D1500] via-[#7A3000] to-[#BA6200]",
  bnpl_roller:           "from-[#0C1A2E] via-[#1E3A5F] to-[#0288D1]",
  grabfood_spiral:       "from-[#2D0C00] via-[#7A1E00] to-[#EA4C0A]",
  bonus_burner:          "from-[#1A1A00] via-[#3D3D00] to-[#CA8A04]",
  future_homeowner:      "from-[#0C1A2E] via-[#1E3A5F] to-[#4FC3F7]",
  savings_starter:       "from-[#0A1F0A] via-[#14401A] to-[#16a34a]",
};

interface PersonaCardProps {
  type: PersonaType;
  name: string;
  emoji: string;
  description: string;
  level: number;
  confidence: number;
  explanation: string;
  suggestedInterventionRule: string;
}

export function PersonaCard({
  type,
  name,
  emoji,
  description,
  level,
  confidence,
  explanation,
  suggestedInterventionRule,
}: PersonaCardProps) {
  const mascot = PERSONA_MASCOTS[type];
  const gradient = PERSONA_GRADIENTS[type] ?? "from-[#1A1825] via-[#2D2B40] to-[#7C5CFF]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white shadow-xl`}
    >
      {/* Decorative blur orbs */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

      {/* Hero section — mascot + identity */}
      <div className="relative flex items-end gap-4 px-5 pt-6 pb-0">
        {mascot ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 22 }}
            className="shrink-0"
          >
            <Image
              src={mascot}
              alt={name}
              width={120}
              height={120}
              className="w-28 h-28 object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>
        ) : (
          <div className="text-6xl shrink-0 pb-3" aria-hidden="true">{emoji}</div>
        )}

        <div className="flex-1 pb-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase">
              Lv.{level}
            </span>
            <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
              {confidence}% match
            </span>
          </div>
          <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-fredoka)" }}>
            {name}
          </h2>
          <p className="mt-1 text-xs text-white/75 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Detail section */}
      <div className="relative mx-4 mb-4 mt-3 space-y-3 rounded-2xl bg-black/20 border border-white/10 p-4 backdrop-blur-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Why this persona</p>
          <p className="text-sm leading-relaxed text-white/85">{explanation}</p>
        </div>
        <div className="border-t border-white/10 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Suggested intervention</p>
          <p className="text-sm leading-relaxed text-white/85">{suggestedInterventionRule}</p>
        </div>
      </div>
    </motion.div>
  );
}
