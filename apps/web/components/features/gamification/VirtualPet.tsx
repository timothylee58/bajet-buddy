"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export type PetType = "squirrel" | "fox" | "raccoon" | "rabbit";

interface VirtualPetProps {
  xp: number;
  streak: number;
  petType?: PetType;
}

interface PetStage {
  image: string;
  name: string;
  tagline: string;
  speechBubble: string;
  minXp: number;
}

const SQUIRREL_STAGES: PetStage[] = [
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

const FOX_STAGES: PetStage[] = [
  {
    image: "/pets/fox-1.png",
    name: "Curious Cub",
    tagline: "A tiny curious fox. Loves to explore and play.",
    speechBubble: "Eh, what's this? Log something lah!",
    minXp: 0,
  },
  {
    image: "/pets/fox-2.png",
    name: "Loyal Scout",
    tagline: "Reliable and loyal. A trusted friend and protector.",
    speechBubble: "Steady! Keep at it, I got your back.",
    minXp: 100,
  },
  {
    image: "/pets/fox-3.png",
    name: "Resourceful Fox",
    tagline: "Smart and resourceful. Solves problems with ease.",
    speechBubble: "Wah clever lah you! Budget game strong.",
    minXp: 300,
  },
  {
    image: "/pets/fox-4.png",
    name: "Wise Strategist",
    tagline: "Wise and strategic. Leads others to victory.",
    speechBubble: "Power! Financial freedom within reach bro.",
    minXp: 600,
  },
  {
    image: "/pets/fox-5.png",
    name: "Legendary Fox",
    tagline: "Brings light, courage and hope.",
    speechBubble: "You made it. Duit sihat, hidup bahagia!",
    minXp: 1000,
  },
];

const RACCOON_STAGES: PetStage[] = [
  {
    image: "/pets/raccoon-1.png",
    name: "Forest Seedling",
    tagline: "A tiny forest explorer. Loves leaves and naps.",
    speechBubble: "Psst... log something lah, I'm hungry!",
    minXp: 0,
  },
  {
    image: "/pets/raccoon-2.png",
    name: "Adventure Scout",
    tagline: "Curious and energetic. Ready for adventure!",
    speechBubble: "Wah, jom track more expenses!",
    minXp: 100,
  },
  {
    image: "/pets/raccoon-3.png",
    name: "Steady Guardian",
    tagline: "Strong and dependable. Protects friends and home.",
    speechBubble: "Budget steady! You got this, bro.",
    minXp: 300,
  },
  {
    image: "/pets/raccoon-4.png",
    name: "Wise Wayfinder",
    tagline: "Wise and resourceful. Guides others to success.",
    speechBubble: "Tabik! Your financial compass never lies.",
    minXp: 600,
  },
  {
    image: "/pets/raccoon-5.png",
    name: "Legendary Ringgit",
    tagline: "A legendary leader. Inspires. Protects. Leads.",
    speechBubble: "Duit sihat, jiwa tenang. You made it!",
    minXp: 1000,
  },
];

const RABBIT_STAGES: PetStage[] = [
  {
    image: "/pets/rabbit-1.png",
    name: "Carrot Baby",
    tagline: "A little bundle of joy. Loves snacks.",
    speechBubble: "Eh, feed me duit info lah!",
    minXp: 0,
  },
  {
    image: "/pets/rabbit-2.png",
    name: "Curious Explorer",
    tagline: "Curious and lively. Always exploring!",
    speechBubble: "Wah, banyak guna! Keep tracking tau!",
    minXp: 100,
  },
  {
    image: "/pets/rabbit-3.png",
    name: "Book Bunny",
    tagline: "Loves learning new things. Brilliant mind!",
    speechBubble: "Ilmu kewangan loaded! You doing great.",
    minXp: 300,
  },
  {
    image: "/pets/rabbit-4.png",
    name: "Strategic Hare",
    tagline: "Strategic and insightful. Plans for success.",
    speechBubble: "Steady lah. Financial plan on point!",
    minXp: 600,
  },
  {
    image: "/pets/rabbit-5.png",
    name: "Legendary Ruler",
    tagline: "A legendary leader. Inspires everyone.",
    speechBubble: "Duit sihat, jiwa tenang. Legend confirmed!",
    minXp: 1000,
  },
];

const PET_STAGES: Record<PetType, PetStage[]> = {
  squirrel: SQUIRREL_STAGES,
  fox: FOX_STAGES,
  raccoon: RACCOON_STAGES,
  rabbit: RABBIT_STAGES,
};

function getStage(stages: PetStage[], xp: number): PetStage {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (xp >= stages[i].minXp) return stages[i];
  }
  return stages[0];
}

function getNextStage(stages: PetStage[], xp: number): PetStage | null {
  for (let i = 0; i < stages.length; i++) {
    if (xp < stages[i].minXp) return stages[i];
  }
  return null;
}

export function VirtualPet({ xp, streak, petType = "squirrel" }: VirtualPetProps) {
  const stages = PET_STAGES[petType];
  const stage = getStage(stages, xp);
  const next = getNextStage(stages, xp);
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

      <div className="relative bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 text-center max-w-[220px] shadow-sm">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-zinc-200 dark:text-zinc-700 text-xs">▲</span>
        {stage.speechBubble}
      </div>

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
