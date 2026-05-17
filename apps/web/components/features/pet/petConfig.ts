import type { PetMood, PetSpecies } from "@/types";

export interface PetStageConfig {
  image: string;
  name: string;
  tagline: string;
  minXp: number;
}

export interface PetSpeciesConfig {
  label: string;
  emoji: string;
  locked: boolean;
  lockReason?: string;
  stages: PetStageConfig[];
}

export const PET_SPECIES: Record<PetSpecies, PetSpeciesConfig> = {
  squirrel: {
    label: "Cikgu Squirrel",
    emoji: "🐿️",
    locked: false,
    stages: [
      { image: "/pets/pet-1.png", name: "Acorn Baby", tagline: "A tiny acorn lover. Loves naps.", minXp: 0 },
      { image: "/pets/pet-2.png", name: "Young Squirrel", tagline: "Energetic and playful!", minXp: 200 },
      { image: "/pets/pet-3.png", name: "Budget Coder", tagline: "Loves solving problems.", minXp: 500 },
      { image: "/pets/pet-4.png", name: "Reliable Saver", tagline: "Strong and reliable.", minXp: 1000 },
      { image: "/pets/pet-5.png", name: "Crypto Bro", tagline: "Wise and strategic.", minXp: 2000 },
    ],
  },
  fox: {
    label: "Foxy Fox",
    emoji: "🦊",
    locked: false,
    stages: [
      { image: "/pets/fox-1.png", name: "Curious Cub", tagline: "A tiny curious fox.", minXp: 0 },
      { image: "/pets/fox-2.png", name: "Loyal Scout", tagline: "Reliable and loyal.", minXp: 200 },
      { image: "/pets/fox-3.png", name: "Resourceful Fox", tagline: "Smart and resourceful.", minXp: 500 },
      { image: "/pets/fox-4.png", name: "Wise Strategist", tagline: "Wise and strategic.", minXp: 1000 },
      { image: "/pets/fox-5.png", name: "Legendary Fox", tagline: "Brings light and courage.", minXp: 2000 },
    ],
  },
  raccoon: {
    label: "Rakun Ranger",
    emoji: "🦝",
    locked: false,
    stages: [
      { image: "/pets/raccoon-1.png", name: "Forest Seedling", tagline: "A tiny forest explorer.", minXp: 0 },
      { image: "/pets/raccoon-2.png", name: "Adventure Scout", tagline: "Curious and energetic!", minXp: 200 },
      { image: "/pets/raccoon-3.png", name: "Steady Guardian", tagline: "Strong and dependable.", minXp: 500 },
      { image: "/pets/raccoon-4.png", name: "Wise Wayfinder", tagline: "Guides others to success.", minXp: 1000 },
      { image: "/pets/raccoon-5.png", name: "Legendary Ringgit", tagline: "A legendary leader.", minXp: 2000 },
    ],
  },
  finance_squirrel: {
    label: "Prof Tupai",
    emoji: "🎓",
    locked: true,
    lockReason: "Premium subscribers only",
    stages: [
      { image: "/pets/pet-1.png", name: "Finance Intern", tagline: "Still learning the basics.", minXp: 0 },
      { image: "/pets/pet-2.png", name: "Junior Analyst", tagline: "Numbers start making sense.", minXp: 200 },
      { image: "/pets/pet-3.png", name: "Portfolio Manager", tagline: "Masters in money management.", minXp: 500 },
      { image: "/pets/pet-4.png", name: "CFO Mode", tagline: "Command the finances.", minXp: 1000 },
      { image: "/pets/pet-5.png", name: "Warren Buffett", tagline: "Legendary financial wisdom.", minXp: 2000 },
    ],
  },
};

export function getStageForXp(species: PetSpecies, xp: number): PetStageConfig {
  const stages = PET_SPECIES[species].stages;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (xp >= stages[i].minXp) return stages[i];
  }
  return stages[0];
}

export const MOOD_ANIMATIONS: Record<PetMood, { y: number[]; scale: number[]; rotate: number[] }> = {
  happy:       { y: [-3, 3, -3],      scale: [1, 1, 1],          rotate: [0, 0, 0] },
  celebrating: { y: [-8, 0, -8],      scale: [1, 1.05, 1],        rotate: [-5, 5, -5] },
  worried:     { y: [-1, 1, -1],      scale: [0.98, 1, 0.98],     rotate: [-2, 2, -2] },
  warning:     { y: [0, -4, 0],       scale: [1, 1.03, 1],        rotate: [-4, 4, -4] },
  sleepy:      { y: [0, 2, 0],        scale: [1, 0.98, 1],        rotate: [0, 0, 0] },
  neutral:     { y: [-2, 2, -2],      scale: [1, 1, 1],           rotate: [0, 0, 0] },
};

export const MOOD_GLOW: Record<PetMood, string> = {
  happy:       "drop-shadow(0 0 12px rgba(52, 211, 153, 0.6))",
  celebrating: "drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))",
  worried:     "drop-shadow(0 0 12px rgba(251, 146, 60, 0.5))",
  warning:     "drop-shadow(0 0 16px rgba(239, 68, 68, 0.7))",
  sleepy:      "drop-shadow(0 0 8px rgba(148, 163, 184, 0.4))",
  neutral:     "drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))",
};

export const MOOD_EMOJI: Record<PetMood, string> = {
  happy: "😊", celebrating: "🎉", worried: "😟",
  warning: "⚠️", sleepy: "😴", neutral: "😐",
};
