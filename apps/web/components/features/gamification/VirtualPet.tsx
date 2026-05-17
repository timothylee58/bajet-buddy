"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface VirtualPetProps {
  streak: number;
}

function getMood(streak: number): { emoji: string; text: string } {
  if (streak === 0) return { emoji: "😢", text: "Lapar... (Your buddy is hungry, log an expense!)" };
  if (streak <= 2) return { emoji: "😐", text: "Okay lah..." };
  if (streak <= 6) return { emoji: "😊", text: "Sihat!" };
  if (streak <= 13) return { emoji: "😄", text: "Gembira! Budget Warrior mode!" };
  return { emoji: "🤩", text: "Legend! Your BajetBuddy is thriving!" };
}

export function VirtualPet({ streak }: VirtualPetProps) {
  const mood = getMood(streak);

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="text-6xl"
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {mood.emoji}
      </motion.div>

      {/* Speech bubble */}
      <div className="relative bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2 text-sm text-white text-center max-w-[200px]">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-zinc-700">▲</span>
        {mood.text}
      </div>

      {streak === 0 ? (
        <Link
          href="/transactions/new"
          className="text-xs text-emerald-400 hover:text-emerald-300 underline transition-colors"
        >
          Feed your buddy — log an expense today!
        </Link>
      ) : (
        <p className="text-xs text-zinc-400">{streak} day streak 🔥</p>
      )}
    </div>
  );
}
