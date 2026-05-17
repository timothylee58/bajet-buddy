"use client";

import { useState } from "react";
import { PersonaCard } from "@/components/features/persona/PersonaCard";
import { XPProgressBar } from "@/components/features/persona/XPProgressBar";
import { AchievementGrid } from "@/components/features/persona/AchievementGrid";
import { VirtualPet, type PetType } from "@/components/features/gamification/VirtualPet";
import { usePersona } from "@/hooks/usePersona";

const PET_OPTIONS: { type: PetType; label: string; emoji: string }[] = [
  { type: "squirrel", label: "Squirrel", emoji: "🐿️" },
  { type: "fox", label: "Fox", emoji: "🦊" },
  { type: "raccoon", label: "Raccoon", emoji: "🦝" },
  { type: "rabbit", label: "Rabbit", emoji: "🐰" },
];

export default function PersonaPage() {
  const { persona, loading } = usePersona();
  const [petType, setPetType] = useState<PetType>("squirrel");

  if (loading || !persona) {
    return <div className="px-4 py-6">Loading persona...</div>;
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Your Persona 🧠</h1>
      <PersonaCard
        name={persona.name}
        emoji={persona.emoji}
        description={persona.description}
        level={persona.level}
        confidence={persona.confidence}
        explanation={persona.explanation}
        suggestedInterventionRule={persona.suggested_intervention_rule}
      />
      {persona.top_signals?.length ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-800">Why this persona</h2>
          <div className="space-y-2">
            {persona.top_signals.map((signal) => (
              <div
                key={signal}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 p-6 flex flex-col items-center">
        <div className="flex w-full items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-500">Your BajetBuddy</h2>
          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {PET_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setPetType(opt.type)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  petType === opt.type
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-700"
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
      <XPProgressBar current={persona.xp} max={persona.xp_to_next} level={persona.level} />
      <AchievementGrid />
    </div>
  );
}
