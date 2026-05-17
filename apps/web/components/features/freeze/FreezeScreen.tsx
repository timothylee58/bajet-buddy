"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Snowflake, Zap } from "lucide-react";
import { OverrideModal } from "./OverrideModal";
import { useFreeze } from "@/hooks/useFreeze";
import { useGamification } from "@/hooks/useGamification";

function formatTimestamp(value?: string) {
  if (!value) return "Not active";
  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FreezeScreen() {
  const { status, loading, error, freeze, override } = useFreeze();
  const gamification = useGamification();
  const [showOverride, setShowOverride] = useState(false);

  const overrideGap = useMemo(
    () => Math.max(status.override_cost_xp - gamification.status.xp, 0),
    [gamification.status.xp, status.override_cost_xp]
  );

  const headerTone = status.active
    ? {
        title: "Freeze Active",
        icon: <ShieldAlert className="h-5 w-5" />,
        tone: "border-brand/25 bg-brand-light text-brand-dark",
      }
    : {
        title: "Guardrail Ready",
        icon: <ShieldCheck className="h-5 w-5" />,
        tone: "border-brand/25 bg-brand-light text-brand-dark",
      };

  return (
    <>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-3xl border p-5 ${headerTone.tone}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                {headerTone.icon}
                <span>{headerTone.title}</span>
              </div>
              <h1 className="text-2xl font-semibold">
                {status.active ? "Bajet Buddy is blocking new spend checks." : "Freeze can be armed before impulse spending starts."}
              </h1>
              <p className="text-sm leading-6 text-zinc-700">
                {status.message}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-brand-dark">
              <Snowflake className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Freeze type</p>
              <p className="mt-2 text-lg font-semibold capitalize">{status.type}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Activated</p>
              <p className="mt-2 text-lg font-semibold">{formatTimestamp(status.activated_at)}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Override cost</p>
              <p className="mt-2 text-lg font-semibold">{status.override_cost_xp} XP</p>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 text-zinc-900">
              <Zap className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-semibold">Gamification status</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">XP balance</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{gamification.status.xp}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Streak</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{gamification.status.streak} days</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>{gamification.status.level_name}</span>
                <span>Level {gamification.status.level}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                <motion.div
                  animate={{ width: `${gamification.status.progress_pct}%` }}
                  transition={{ duration: 0.35 }}
                  className="h-full rounded-full bg-brand"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Progress to next level: {gamification.status.progress_pct.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-950">Freeze actions</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => freeze("soft")}
                disabled={loading}
                className="flex w-full items-start justify-between rounded-2xl border border-brand/25 bg-brand-light px-4 py-4 text-left transition-colors hover:bg-brand-muted disabled:opacity-60"
              >
                <div>
                  <p className="font-semibold text-brand-dark">Soft freeze</p>
                  <p className="mt-1 text-sm text-brand-dark/80">Auto-block spend checks but allow emergency override.</p>
                </div>
                <span className="text-sm font-medium text-brand">Overrideable</span>
              </button>
              <button
                onClick={() => freeze("hard")}
                disabled={loading}
                className="flex w-full items-start justify-between rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-4 text-left text-white transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                <div>
                  <p className="font-semibold">Hard freeze</p>
                  <p className="mt-1 text-sm text-zinc-300">Lock the account until the spending window passes.</p>
                </div>
                <span className="text-sm font-medium text-zinc-300">No bypass</span>
              </button>
              <button
                onClick={() => setShowOverride(true)}
                disabled={!status.active || !status.can_override || overrideGap > 0}
                className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Emergency override ({status.override_cost_xp} XP)
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              {overrideGap > 0 ? (
                <p>You need {overrideGap} more XP before a soft-freeze override is allowed.</p>
              ) : (
                <p>Override is available only for soft freezes and immediately deducts XP.</p>
              )}
              <p>Manual freezes are useful when late-night shopping or payday spikes are about to start.</p>
            </div>
          </div>
        </section>

        {(error || gamification.error) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {[error, gamification.error].filter(Boolean).join(" ")}
          </div>
        )}
      </div>

      {showOverride && (
        <OverrideModal
          xpCost={status.override_cost_xp}
          onConfirm={async () => {
            const succeeded = await override();
            if (succeeded) {
              await gamification.refresh();
              setShowOverride(false);
            }
          }}
          onCancel={() => setShowOverride(false)}
        />
      )}
    </>
  );
}
