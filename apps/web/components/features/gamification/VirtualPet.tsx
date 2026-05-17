"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

interface VirtualPetProps {
  xp: number;
  streak: number;
}

interface PetStage {
  image: string;
  name: string;
  tagline: string;
  speechBubble: string;
  minXp: number;
}

const PET_STAGES: PetStage[] = [
  {
    image: "/pets/pet-1.png",
    name: "Acorn Baby",
    tagline: "A tiny acorn lover. Loves naps.",
    speechBubble: "Lapar... log something lah!",
    minXp: 0,
  },
  {
    image: "/pets/pet-2.png",
    name: "Young Squirrel",
    tagline: "Energetic and playful. Always curious!",
    speechBubble: "Okay lah, keep tracking!",
    minXp: 100,
  },
  {
    image: "/pets/pet-3.png",
    name: "Budget Coder",
    tagline: "Loves solving problems. Learning is fun!",
    speechBubble: "Wah, you're getting good at this!",
    minXp: 300,
  },
  {
    image: "/pets/pet-4.png",
    name: "Reliable Saver",
    tagline: "Strong and reliable.",
    speechBubble: "Tabik! Budget warrior confirmed.",
    minXp: 600,
  },
  {
    image: "/pets/pet-5.png",
    name: "Crypto Bro",
    tagline: "Wise and strategic. Knows the value of assets.",
    speechBubble: "Steady bro. Financial freedom loading...",
    minXp: 1000,
  },
];

function getStage(xp: number): PetStage {
  for (let i = PET_STAGES.length - 1; i >= 0; i--) {
    if (xp >= PET_STAGES[i].minXp) return PET_STAGES[i];
  }
  return PET_STAGES[0];
}

function getNextStage(xp: number): PetStage | null {
  for (let i = 0; i < PET_STAGES.length; i++) {
    if (xp < PET_STAGES[i].minXp) return PET_STAGES[i];
  }
  return null;
}

export function VirtualPet({ xp, streak }: VirtualPetProps) {
  const stage = getStage(xp);
  const next = getNextStage(xp);
  const progressPct = next
    ? Math.round(((xp - stage.minXp) / (next.minXp - stage.minXp)) * 100)
    : 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        key={stage.name}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Image
            src={stage.image}
            alt={stage.name}
            width={160}
            height={160}
            className="w-40 h-40 object-contain drop-shadow-lg"
            priority
          />
        </motion.div>

        {streak >= 7 && (
          <motion.div
            className="absolute -top-2 -right-2 text-xl"
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🔥
          </motion.div>
        )}
      </motion.div>

      <div className="text-center">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{stage.name}</p>
        <p className="text-xs text-zinc-500 italic">{stage.tagline}</p>
      </div>

      {/* Speech bubble */}
      <div className="relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 text-center max-w-[220px] shadow-sm">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-zinc-200 dark:text-zinc-700 text-xs">▲</span>
        {stage.speechBubble}
      </div>

      {/* XP progress bar */}
      <div className="w-full max-w-[200px]">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{xp} XP</span>
          {next ? <span>Next: {next.minXp} XP</span> : <span>Max level!</span>}
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {next && (
          <p className="text-xs text-zinc-500 text-center mt-1">
            {next.minXp - xp} XP to evolve into <span className="text-emerald-600 font-medium">{next.name}</span>
          </p>
        )}
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
