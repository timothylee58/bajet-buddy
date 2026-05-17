"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlock_condition: string;
  unlocked: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse flex flex-col gap-3">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="h-4 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-full bg-white/10 rounded" />
      <div className="h-3 w-2/3 bg-white/10 rounded" />
    </div>
  );
}

export function AgentRoster() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/gamification/agents`)
      .then((r) => r.json())
      .then((data: Agent[]) => setAgents(data))
      .catch(() => {/* silently handle */ })
      .finally(() => setLoading(false));
  }, []);

  const firstUnlockedId = agents.find((a) => a.unlocked)?.id;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Advisors</h2>
        <p className="text-sm text-white/50 mt-1">Unlock new personalities as you track</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : agents.map((agent) => {
              const isActive = agent.id === firstUnlockedId;
              return (
                <div
                  key={agent.id}
                  className={[
                    "relative rounded-2xl border p-5 flex flex-col gap-2 transition-all",
                    agent.unlocked
                      ? isActive
                        ? "bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-400/30 animate-pulse-slow"
                        : "bg-white/5 border-emerald-600/40 hover:border-emerald-400/70 hover:shadow-emerald-400/20 hover:shadow-md"
                      : "bg-white/3 border-white/10 grayscale opacity-60",
                  ].join(" ")}
                >
                  {!agent.unlocked && (
                    <span className="absolute top-3 right-3 text-lg" aria-label="Locked">
                      🔒
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                      Active
                    </span>
                  )}
                  <span className="text-4xl">{agent.emoji}</span>
                  <p className="text-base font-bold text-white">{agent.name}</p>
                  <p className="text-sm text-white/60 flex-1">{agent.description}</p>
                  <p className="text-xs text-white/30 mt-1">{agent.unlock_condition}</p>
                </div>
              );
            })}
      </div>
    </section>
  );
}
