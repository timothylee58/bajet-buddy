"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/constants";

interface LootBoxReward {
  rarity: string;
  coins: number;
  label: string;
  emoji: string;
  new_total_coins: number;
  xp_awarded: number;
}

type Phase = "idle" | "opening" | "revealed";

const RARITY_STYLES: Record<string, { badge: string; glow: string; stars: string }> = {
  common:    { badge: "bg-zinc-700 text-zinc-200",           glow: "shadow-zinc-400/40",   stars: "★" },
  rare:      { badge: "bg-sky-700 text-sky-100",             glow: "shadow-sky-400/60",    stars: "★★" },
  epic:      { badge: "bg-purple-700 text-purple-100",       glow: "shadow-purple-400/70", stars: "★★★" },
  legendary: { badge: "bg-amber-500 text-amber-950 font-bold", glow: "shadow-amber-400/80", stars: "★★★★" },
};

interface LootBoxRevealProps {
  onClose: () => void;
  userId?: string;
}

export function LootBoxReveal({ onClose }: LootBoxRevealProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reward, setReward] = useState<LootBoxReward | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setPhase("opening");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/gamification/loot-box`, { method: "POST" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: LootBoxReward = await res.json();
      // Short delay so the opening animation plays
      setTimeout(() => {
        setReward(data);
        setPhase("revealed");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }

  function handleClose() {
    setPhase("idle");
    setReward(null);
    onClose();
  }

  const rarityStyle = reward ? (RARITY_STYLES[reward.rarity] ?? RARITY_STYLES.common) : RARITY_STYLES.common;

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] py-8">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.button
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              onClick={handleOpen}
              className="text-8xl cursor-pointer hover:scale-110 transition-transform focus:outline-none"
              aria-label="Open Loot Box"
            >
              🎁
            </motion.button>
            <span className="text-lg font-semibold text-white/80">Open Loot Box</span>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </motion.div>
        )}

        {phase === "opening" && (
          <motion.div
            key="opening"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: [1, 1.3, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-8xl"
          >
            🎁
          </motion.div>
        )}

        {phase === "revealed" && reward && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className={`text-7xl drop-shadow-xl shadow-2xl ${rarityStyle.glow}`}
            >
              {reward.emoji}
            </motion.div>

            <span
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-widest ${rarityStyle.badge}`}
            >
              {reward.rarity} {rarityStyle.stars}
            </span>

            <p className="text-xl font-bold text-white">{reward.label}</p>

            <p className="text-base text-white/70">
              +{reward.coins} coins &nbsp;·&nbsp; +{reward.xp_awarded} XP
            </p>

            <p className="text-sm text-white/50">
              Total coins: {reward.new_total_coins}
            </p>

            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
