"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatRM } from "@/lib/utils";
import type { InflationQuest } from "@/types";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
  legendary: "bg-violet-100 text-violet-700 animate-pulse",
};

interface Props {
  quests: InflationQuest[];
  onComplete: (id: string) => void;
}

export function QuestPanel({ quests, onComplete }: Props) {
  if (quests.length === 0) return null;

  return (
    <div>
      <div className="text-base font-bold text-zinc-800 mb-3">🎮 Inflation Shield Quests</div>
      <div className="flex flex-col gap-3">
        {quests.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-4",
              quest.completed && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{quest.badge_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-zinc-800">{quest.title}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DIFFICULTY_STYLES[quest.difficulty])}>
                    {quest.difficulty}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mb-1">{quest.title_bm}</div>
                <div className="text-xs text-zinc-400 mb-2">{quest.description}</div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>{formatRM(quest.current_rm)} / {formatRM(quest.target_rm)}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">+{quest.xp_reward} XP</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(quest.progress_pct, 100)}%` }}
                  />
                </div>
                {quest.completed ? (
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    <span>✅</span> <span>Claimed!</span>
                  </div>
                ) : quest.active && quest.progress_pct >= 100 ? (
                  <button
                    onClick={() => onComplete(quest.id)}
                    className="text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-xl"
                  >
                    Complete Quest
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
