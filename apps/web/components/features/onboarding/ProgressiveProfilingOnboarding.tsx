"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Flame,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgressiveProfiling } from "@/hooks/useProgressiveProfiling";
import { cn } from "@/lib/utils";
import type {
  ProfilingAgentStatus,
  ProfilingGoal,
  ProfilingGoalType,
  ProfilingLayer,
  ProfilingLayerStatus,
  UnlockableAgent,
} from "@/types";

const GOAL_COMMITMENTS: Record<ProfilingGoalType, number> = {
  emergency_fund: 500,
  debt_reduction: 350,
  home_savings: 800,
  no_spend: 200,
};

const layerTone: Record<
  ProfilingLayerStatus,
  { badge: string; panel: string; label: string }
> = {
  complete: {
    badge: "bg-brand/10 text-brand-dark border-brand/20",
    panel: "border-brand/25 bg-brand-light/80",
    label: "Complete",
  },
  active: {
    badge: "bg-brand/10 text-brand-dark border-brand/20",
    panel: "border-brand/25 bg-brand-light/80",
    label: "Active",
  },
  available: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    panel: "border-amber-200 bg-amber-50/80",
    label: "Available",
  },
  locked: {
    badge: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
    panel: "border-zinc-200 bg-zinc-50",
    label: "Locked",
  },
};

const agentTone: Record<
  ProfilingAgentStatus,
  { badge: string; dot: string; label: string }
> = {
  unlocked: {
    badge: "border-brand/25 bg-brand-light text-brand-dark",
    dot: "bg-brand",
    label: "Unlocked",
  },
  ready: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    label: "Ready",
  },
  locked: {
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
    dot: "bg-zinc-400",
    label: "Locked",
  },
};

function LayerCard({ layer }: { layer: ProfilingLayer }) {
  const tone = layerTone[layer.status];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("rounded-3xl border p-5", tone.panel)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              tone.badge
            )}
          >
            {tone.label}
          </span>
          <h2 className="text-lg font-semibold text-zinc-950">{layer.title}</h2>
          <p className="text-sm leading-6 text-zinc-700">{layer.description}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-zinc-700">
          {layer.id === "layer_0" ? (
            <Sparkles className="h-5 w-5" />
          ) : layer.id === "layer_1" ? (
            <Radar className="h-5 w-5" />
          ) : layer.id === "layer_2" ? (
            <BrainCircuit className="h-5 w-5" />
          ) : (
            <Target className="h-5 w-5" />
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Value unlocked
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-800">{layer.value_unlocked}</p>
      </div>

      <div className="mt-4 space-y-2">
        {layer.signals.map((signal) => (
          <div
            key={signal}
            className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-zinc-700"
          >
            {signal}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">{layer.cta}</span>
        <ArrowRight className="h-4 w-4 text-zinc-500" />
      </div>
    </motion.div>
  );
}

function GoalCard({
  goal,
  onActivate,
  busy,
}: {
  goal: ProfilingGoal;
  onActivate: (type: ProfilingGoalType, amount: number) => Promise<void>;
  busy: boolean;
}) {
  const defaultCommitment = GOAL_COMMITMENTS[goal.type];
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">{goal.label}</h3>
          <p className="mt-1 text-sm text-zinc-600">{goal.commitment_label}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            goal.started
              ? "bg-brand-light text-brand-dark"
              : "bg-zinc-100 text-zinc-600"
          )}
        >
          {goal.started ? "Live" : "Optional"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{goal.progress_label}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">
          Suggested start: RM{defaultCommitment}/month
        </span>
        {!goal.started ? (
          <Button
            size="sm"
            onClick={() => void onActivate(goal.type, defaultCommitment)}
            disabled={busy}
          >
            Start
          </Button>
        ) : (
          <ShieldCheck className="h-4 w-4 text-brand" />
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: UnlockableAgent }) {
  const tone = agentTone[agent.status];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} />
            <h3 className="text-base font-semibold text-zinc-950">{agent.label}</h3>
          </div>
          <p className="text-sm leading-6 text-zinc-600">{agent.description}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            tone.badge
          )}
        >
          {tone.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Unlock rule
        </p>
        <p className="mt-2 text-sm text-zinc-800">{agent.unlock_rule}</p>
        <p className="mt-3 text-sm text-zinc-600">{agent.progress_label}</p>
      </div>
    </motion.div>
  );
}

export function ProgressiveProfilingOnboarding() {
  const { summary, loading, error, activateGoal } = useProgressiveProfiling();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 text-foreground shadow-[0_24px_80px_-32px_rgba(124,92,255,0.3)] backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Progressive profiling
            </span>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight">
                Onboarding that earns data through value, not forms.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted">
                Bajet Buddy starts with an instant verdict, captures behaviour passively, waits for real pattern confidence,
                and only asks for high-commitment goal data when the user is ready.
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark">
                Product principle
              </p>
              <p className="mt-2 text-base font-medium text-foreground">{summary.principle}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{summary.next_best_action}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/check?demo=sarah">See instant value</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-primary-dark">Profile score</p>
              <p className="mt-2 text-4xl font-semibold">{summary.profile_score}</p>
              <p className="mt-2 text-sm text-muted">Built from real usage depth, not front-loaded forms.</p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-tertiary">
                <Flame className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary-dark">Streak</p>
              </div>
              <p className="mt-2 text-4xl font-semibold">{summary.streak}</p>
              <p className="mt-2 text-sm text-muted">Consistent checking earns more protection and unlocks more coaching.</p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary-dark">
                <Trophy className="h-4 w-4" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary-dark">XP</p>
              </div>
              <p className="mt-2 text-4xl font-semibold">{summary.xp}</p>
              <p className="mt-2 text-sm text-muted">{summary.days_observed} days of observed behaviour in the current profile.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary-dark" />
          <h2 className="text-xl font-semibold text-foreground">Progressive profiling layers</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.layers.map((layer) => (
            <LayerCard key={layer.id} layer={layer} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-dark" />
            <h2 className="text-xl font-semibold text-foreground">Layer 3 goal-directed data</h2>
          </div>
          <div className="grid gap-4">
            {summary.goals.map((goal) => (
              <GoalCard
                key={goal.type}
                goal={goal}
                busy={loading}
                onActivate={async (type, amount) => {
                  await activateGoal(type, amount);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary-dark" />
            <h2 className="text-xl font-semibold text-foreground">Unlockable AI agents</h2>
          </div>
          <div className="grid gap-4">
            {summary.unlockable_agents.map((agent) => (
              <AgentCard key={agent.code} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Using fallback onboarding state: {error}
        </div>
      ) : null}

      <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-zinc-950">Why this matters</h2>
            <p className="max-w-3xl text-sm leading-7 text-zinc-600">
              The first screen gives value fast. The second layer learns passively. The third waits for pattern confidence.
              The fourth only asks for deliberate goals, then uses XP, streaks, and unlockable agents to keep retention tied to better financial behaviour.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Revenue and retention come from deeper commitment, not forcing data collection on day one.
          </div>
        </div>
      </section>
    </div>
  );
}
