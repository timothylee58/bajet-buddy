"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { DailyLogin } from "@/components/features/profile/DailyLogin";
import { ConnectionsList } from "@/components/features/profile/ConnectionsList";
import { ChallengeCard } from "@/components/features/buddies/ChallengeCard";
import { PersonaCard } from "@/components/features/persona/PersonaCard";
import { XPProgressBar } from "@/components/features/persona/XPProgressBar";
import { AchievementGrid } from "@/components/features/persona/AchievementGrid";
import { VirtualPet, type PetType } from "@/components/features/gamification/VirtualPet";
import { usePersona } from "@/hooks/usePersona";
import { Loader2 } from "lucide-react";

const PET_OPTIONS: { type: PetType; label: string; emoji: string }[] = [
  { type: "squirrel", label: "Squirrel", emoji: "🐿️" },
  { type: "fox", label: "Fox", emoji: "🦊" },
  { type: "raccoon", label: "Raccoon", emoji: "🦝" },
  { type: "rabbit", label: "Rabbit", emoji: "🐰" },
];

export default function ProfilesPage() {
  const { persona, loading: personaLoading } = usePersona();
  const [petType, setPetType] = useState<PetType>("squirrel");

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Your Profile</h1>
      </div>

      {/* Level, XP, Streak */}
      <ProfileHeader />

      {/* Persona — AI personality analysis */}
      {personaLoading ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="ml-2 text-sm text-zinc-400">Analyzing your spending persona...</span>
        </div>
      ) : persona ? (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">AI Persona</h2>
          <PersonaCard
            type={persona.type}
            name={persona.name}
            emoji={persona.emoji}
            description={persona.description}
            level={persona.level}
            confidence={persona.confidence}
            explanation={persona.explanation}
            suggestedInterventionRule={persona.suggested_intervention_rule}
          />
          {persona.top_signals?.length ? (
            <div className="mt-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
              <p className="text-xs font-semibold text-zinc-500 mb-2">Why this persona</p>
              <div className="flex flex-wrap gap-2">
                {persona.top_signals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* XP Progress */}
      {persona && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Progress</h2>
          <XPProgressBar
            current={persona.xp}
            max={persona.xp_to_next}
            level={persona.level}
          />
        </section>
      )}

      {/* Virtual Pet */}
      {persona && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Companion</h2>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-400">Choose your BajetBuddy</p>
              <div className="flex gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1">
                {PET_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setPetType(opt.type)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      petType === opt.type
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <VirtualPet xp={persona.xp} streak={persona.streak ?? 0} petType={petType} />
          </div>
        </section>
      )}

      {/* Achievements */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Achievements</h2>
        <AchievementGrid />
      </section>

      {/* Active Challenges */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Active Challenges</h2>
        <ChallengeCard
          title="No Shopee Week"
          description="Don't buy anything on Shopee for 7 days"
          participants={12}
          daysLeft={3}
          joined={true}
        />
      </section>

      {/* Leaderboard / Connections */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Leaderboard</h2>
        <ConnectionsList />
      </section>

      {/* Daily login streak */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Weekly Streak</h2>
        <DailyLogin />
      </section>
    </div>
  );
}
