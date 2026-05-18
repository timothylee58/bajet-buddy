"use client";

import { motion } from "framer-motion";
import { formatRM } from "@/lib/utils";
import type { InflationQuest } from "@/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
  legendary: "bg-violet-100 text-violet-700",
};

function getDifficultyColor(d: string) {
  const map: Record<string, string> = {
    easy: "from-emerald-400 to-emerald-500",
    medium: "from-amber-400 to-amber-500",
    hard: "from-orange-400 to-red-500",
    legendary: "from-violet-400 to-purple-500",
  };
  return map[d] ?? "from-zinc-400 to-zinc-500";
}

interface Props {
  quests: InflationQuest[];
  onComplete: (id: string) => void;
}

export function QuestPanel({ quests, onComplete }: Props) {
  if (quests.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎮</span>
        <span className="text-sm font-bold text-zinc-700">Inflation Shield Quests</span>
      </div>

      <div className="flex flex-col gap-3">
        {quests.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-white/80 border border-zinc-200/60 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{quest.badge_emoji}</span>
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-zinc-800">{quest.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_STYLES[quest.difficulty]}`}>
                    {quest.difficulty}
                  </span>
                  {quest.completed && <span className="text-xs">✅</span>}
                </div>

                <p className="text-xs text-zinc-400">{quest.description}</p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">
                      {formatRM(quest.current_rm)} / {formatRM(quest.target_rm)}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full">
                      +{quest.xp_reward} XP
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getDifficultyColor(quest.difficulty)}`}
                      style={{ width: `${Math.min(quest.progress_pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Action button */}
                {quest.completed ? (
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    ✅ <span>Reward claimed!</span>
                  </div>
                ) : quest.active && quest.progress_pct >= 100 ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onComplete(quest.id)}
                    className="text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 rounded-xl shadow-sm"
                  >
                    🎁 Claim Reward
                  </motion.button>
                ) : quest.active ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>In progress — keep spending mindfully!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>⏳</span>
                    <span>Not yet active</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
