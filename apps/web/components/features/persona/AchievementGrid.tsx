"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Star, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Badge Data ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: "streak" | "spending" | "social" | "scan" | "legend";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  unlocked: boolean;
  progress?: number;   // 0–100
  progressLabel?: string;
  unlockedAt?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak
  {
    id: "first_check",
    emoji: "🎯",
    name: "First Check",
    description: "Complete your first spend check with the AI advisor.",
    category: "spending",
    rarity: "common",
    xpReward: 10,
    unlocked: true,
    unlockedAt: "14 May 2026",
  },
  {
    id: "streak_3",
    emoji: "🔥",
    name: "3-Day Streak",
    description: "Log a transaction or check spend 3 days in a row.",
    category: "streak",
    rarity: "common",
    xpReward: 25,
    unlocked: true,
    unlockedAt: "15 May 2026",
  },
  {
    id: "streak_7",
    emoji: "🔥",
    name: "7-Day Streak",
    description: "Stay active for a full week without missing a day.",
    category: "streak",
    rarity: "rare",
    xpReward: 75,
    unlocked: true,
    unlockedAt: "17 May 2026",
  },
  {
    id: "streak_30",
    emoji: "🌟",
    name: "30-Day Streak",
    description: "One month of daily engagement — you're consistent!",
    category: "streak",
    rarity: "epic",
    xpReward: 200,
    unlocked: false,
    progress: 57,
    progressLabel: "17 / 30 days",
  },
  // Spending
  {
    id: "no_shopee",
    emoji: "🛍️",
    name: "No Shopee Week",
    description: "Go 7 days without buying anything from Shopee.",
    category: "spending",
    rarity: "rare",
    xpReward: 100,
    unlocked: false,
    progress: 43,
    progressLabel: "3 / 7 days",
  },
  {
    id: "saver_100",
    emoji: "💰",
    name: "Saved RM100",
    description: "Walk away from impulse purchases totalling RM100.",
    category: "spending",
    rarity: "rare",
    xpReward: 100,
    unlocked: false,
    progress: 62,
    progressLabel: "RM62 / RM100",
  },
  {
    id: "budget_master",
    emoji: "👑",
    name: "Budget Master",
    description: "Stay under budget in every category for a full month.",
    category: "spending",
    rarity: "epic",
    xpReward: 250,
    unlocked: false,
    progress: 0,
    progressLabel: "0 / 4 weeks",
  },
  {
    id: "walk_away_5",
    emoji: "🧘",
    name: "Cool-Head",
    description: "Walk away from 5 FOMO purchases using the Negotiator.",
    category: "spending",
    rarity: "rare",
    xpReward: 75,
    unlocked: false,
    progress: 40,
    progressLabel: "2 / 5 walk-aways",
  },
  // Scan
  {
    id: "first_scan",
    emoji: "🧾",
    name: "Receipt Rookie",
    description: "Scan your first receipt with the OCR scanner.",
    category: "scan",
    rarity: "common",
    xpReward: 20,
    unlocked: true,
    unlockedAt: "16 May 2026",
  },
  {
    id: "scan_5",
    emoji: "📸",
    name: "Receipt Hunter",
    description: "Scan 5 receipts and keep your spending tracked.",
    category: "scan",
    rarity: "common",
    xpReward: 50,
    unlocked: false,
    progress: 20,
    progressLabel: "1 / 5 receipts",
  },
  {
    id: "under_avg",
    emoji: "📉",
    name: "Budget Warrior",
    description: "Scan a receipt that comes in under your category average.",
    category: "scan",
    rarity: "rare",
    xpReward: 50,
    unlocked: false,
    progress: 0,
    progressLabel: "0 / 1 receipt",
  },
  // Social
  {
    id: "social_buddy",
    emoji: "👥",
    name: "Social Buddy",
    description: "Invite a friend and have them join a challenge together.",
    category: "social",
    rarity: "common",
    xpReward: 30,
    unlocked: false,
    progress: 0,
    progressLabel: "0 / 1 friend",
  },
  {
    id: "challenge_win",
    emoji: "🥇",
    name: "Challenge Champion",
    description: "Win a spending challenge against a friend.",
    category: "social",
    rarity: "epic",
    xpReward: 150,
    unlocked: false,
    progress: 0,
    progressLabel: "0 / 1 challenge",
  },
  // Legend
  {
    id: "legend",
    emoji: "🏆",
    name: "BajetBuddy Legend",
    description: "Unlock every badge and reach Level 10. The ultimate achievement.",
    category: "legend",
    rarity: "legendary",
    xpReward: 1000,
    unlocked: false,
    progress: 8,
    progressLabel: "3 / 14 badges",
  },
];

// ─── Rarity config ────────────────────────────────────────────────────────────

const RARITY_CONFIG: Record<Achievement["rarity"], {
  label: string;
  bg: string;
  border: string;
  glow: string;
  text: string;
  stars: number;
}> = {
  common:    { label: "Common",    bg: "bg-zinc-50",       border: "border-zinc-200",      glow: "",                               text: "text-zinc-500",        stars: 1 },
  rare:      { label: "Rare",      bg: "bg-blue-50",       border: "border-blue-200",      glow: "shadow-blue-200/60",             text: "text-blue-600",        stars: 2 },
  epic:      { label: "Epic",      bg: "bg-violet-50",     border: "border-violet-300",    glow: "shadow-violet-200/60",           text: "text-violet-600",      stars: 3 },
  legendary: { label: "Legendary", bg: "bg-amber-50",      border: "border-amber-300",     glow: "shadow-amber-300/70",            text: "text-amber-600",       stars: 4 },
};

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Achievement["category"], { label: string; emoji: string }> = {
  streak:   { label: "Streak",   emoji: "🔥" },
  spending: { label: "Spending", emoji: "💸" },
  scan:     { label: "Scan",     emoji: "🧾" },
  social:   { label: "Social",   emoji: "👥" },
  legend:   { label: "Legend",   emoji: "🏆" },
};

// ─── Badge Detail Modal ───────────────────────────────────────────────────────

function BadgeDetailModal({
  badge,
  onClose,
}: {
  badge: Achievement;
  onClose: () => void;
}) {
  const rarity = RARITY_CONFIG[badge.rarity];
  const cat = CATEGORY_CONFIG[badge.category];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-sm rounded-3xl border-2 p-6 shadow-2xl",
            rarity.bg, rarity.border,
            badge.unlocked && rarity.glow ? `shadow-xl ${rarity.glow}` : ""
          )}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 text-zinc-500 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge hero */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <motion.div
              animate={badge.unlocked ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border-2",
                badge.unlocked ? rarity.border : "border-zinc-200 grayscale opacity-40"
              )}
            >
              {badge.emoji}
            </motion.div>

            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < rarity.stars ? rarity.text : "text-zinc-200"
                  )}
                  fill={i < rarity.stars ? "currentColor" : "none"}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="font-headline text-xl font-bold text-foreground">{badge.name}</p>
              <span className={cn("font-sans text-xs font-bold uppercase tracking-wider", rarity.text)}>
                {rarity.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-sm text-zinc-600 text-center leading-relaxed mb-4">
            {badge.description}
          </p>

          {/* XP */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-headline font-bold text-amber-600 text-sm">+{badge.xpReward} XP</span>
            <span className="font-sans text-xs text-zinc-400">on unlock</span>
          </div>

          {/* Status */}
          {badge.unlocked ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="font-sans text-xs font-bold text-emerald-600">✓ Unlocked</p>
              {badge.unlockedAt && (
                <p className="font-sans text-[10px] text-emerald-500 mt-0.5">{badge.unlockedAt}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/60 border border-zinc-200 p-3">
              <div className="flex justify-between text-xs font-sans mb-2">
                <span className="text-zinc-500 font-semibold">Progress</span>
                <span className="text-zinc-700 font-bold">{badge.progressLabel ?? "Not started"}</span>
              </div>
              {badge.progress !== undefined && (
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${badge.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn("h-full rounded-full", badge.progress > 0 ? "bg-primary" : "bg-zinc-300")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Category pill */}
          <div className="flex justify-center mt-4">
            <span className="font-sans text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
              {cat.emoji} {cat.label}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge, onClick }: { badge: Achievement; onClick: () => void }) {
  const rarity = RARITY_CONFIG[badge.rarity];

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all cursor-pointer",
        badge.unlocked
          ? cn(rarity.bg, rarity.border, rarity.glow ? `shadow-lg ${rarity.glow}` : "shadow-sm")
          : "bg-zinc-50 border-zinc-200 shadow-sm"
      )}
    >
      {/* Lock overlay for locked */}
      {!badge.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3 h-3 text-zinc-400" />
        </div>
      )}

      {/* Rarity stars — top left for unlocked */}
      {badge.unlocked && (
        <div className="absolute top-2 left-2 flex gap-0.5">
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Star key={i} className={cn("w-2.5 h-2.5", rarity.text)} fill="currentColor" />
          ))}
        </div>
      )}

      {/* Emoji */}
      <motion.span
        animate={badge.unlocked ? { y: [0, -2, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className={cn(
          "text-3xl leading-none mt-1",
          !badge.unlocked && "grayscale opacity-35"
        )}
      >
        {badge.emoji}
      </motion.span>

      {/* Name */}
      <p className={cn(
        "font-sans text-[11px] font-bold leading-tight",
        badge.unlocked ? "text-zinc-800" : "text-zinc-400"
      )}>
        {badge.name}
      </p>

      {/* Progress bar for locked badges */}
      {!badge.unlocked && badge.progress !== undefined && badge.progress > 0 && (
        <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${badge.progress}%` }}
          />
        </div>
      )}

      {/* XP tag for unlocked */}
      {badge.unlocked && (
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
          rarity.text,
          rarity.bg
        )}>
          +{badge.xpReward} XP
        </span>
      )}
    </motion.button>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "all",      label: "All",     emoji: "🎖️" },
  { id: "streak",   label: "Streak",  emoji: "🔥" },
  { id: "spending", label: "Spend",   emoji: "💸" },
  { id: "scan",     label: "Scan",    emoji: "🧾" },
  { id: "social",   label: "Social",  emoji: "👥" },
  { id: "legend",   label: "Legend",  emoji: "🏆" },
] as const;

export function AchievementGrid() {
  const [filter, setFilter] = useState<"all" | Achievement["category"]>("all");
  const [selected, setSelected] = useState<Achievement | null>(null);

  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const filtered = filter === "all"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === filter);

  return (
    <>
      {/* Summary header */}
      <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl bg-gradient-to-r from-primary to-amber-500 text-white chunky-shadow">
        <Trophy className="w-8 h-8 shrink-0 text-white/90" />
        <div className="flex-1">
          <p className="font-headline text-xl font-bold">{unlocked.length} / {ACHIEVEMENTS.length} Badges</p>
          <div className="w-full h-1.5 bg-white/30 rounded-full mt-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-headline text-2xl font-bold">
            {unlocked.reduce((sum, a) => sum + a.xpReward, 0)}
          </p>
          <p className="font-sans text-[10px] text-white/70 uppercase tracking-wide">XP earned</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans text-xs font-bold transition-all",
              filter === tab.id
                ? "bg-primary text-white shadow-sm"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        key={filter}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        {filtered.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            onClick={() => setSelected(badge)}
          />
        ))}
      </motion.div>

      {/* Detail modal */}
      {selected && (
        <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
