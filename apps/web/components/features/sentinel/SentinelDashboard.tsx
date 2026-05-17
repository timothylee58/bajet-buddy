"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getSentinelDashboard,
  simulateMacroEvent,
  completeSentinelQuest,
  awardPetXP,
} from "@/lib/api";
import type {
  SentinelDashboardResponse,
  SimulateEventResponse,
  MacroEventType,
  InflationQuest,
} from "@/types";
import { SentinelHeatBar } from "./SentinelHeatBar";
import { SpendingCategoryCard } from "./SpendingCategoryCard";
import { RiskProfileCard } from "./RiskProfileCard";
import { ActiveEventBanner } from "./ActiveEventBanner";
import { QuestPanel } from "./QuestPanel";
import { AdminSimulatorPanel } from "./AdminSimulatorPanel";
import { MacroAlertModal } from "./MacroAlertModal";
import { formatRM } from "@/lib/utils";

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`h-3 bg-zinc-200 rounded-full animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-zinc-200 rounded-2xl mx-auto animate-pulse" />
        <SkeletonBar className="w-48 mx-auto h-4" />
        <SkeletonBar className="w-32 mx-auto h-3" />
      </div>
      <div className="rounded-3xl bg-white/80 p-5 space-y-3">
        <SkeletonBar className="w-24 h-4" />
        <SkeletonBar className="w-full h-8" />
        <SkeletonBar className="w-16 h-3" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/80 p-4 space-y-2">
          <SkeletonBar className="w-16 h-4" />
          <SkeletonBar className="w-20 h-6" />
          <SkeletonBar className="w-full h-2" />
        </div>
        <div className="rounded-2xl bg-white/80 p-4 space-y-2">
          <SkeletonBar className="w-16 h-4" />
          <SkeletonBar className="w-20 h-6" />
          <SkeletonBar className="w-full h-2" />
        </div>
      </div>
    </div>
  );
}

export function SentinelDashboard() {
  const [dashboard, setDashboard] = useState<SentinelDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<SimulateEventResponse | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [quests, setQuests] = useState<InflationQuest[]>([]);

  useEffect(() => {
    getSentinelDashboard()
      .then((data) => {
        setDashboard(data);
        setQuests(data.quests);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSimulate(event_type: MacroEventType) {
    setSimulating(true);
    try {
      const result = await simulateMacroEvent(event_type);
      setImpact(result);
      setAlertOpen(true);
      if (result.quests_generated.length > 0) {
        setQuests((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const newQuests = result.quests_generated.filter(
            (q) => !existingIds.has(q.id)
          );
          return [...newQuests, ...prev];
        });
      }
    } finally {
      setSimulating(false);
    }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      await completeSentinelQuest(questId);
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, completed: true } : q))
      );
      awardPetXP({ event: "goal_complete" }).catch(() => {});
    } catch {
      // ignore
    }
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">😵</span>
        <p className="text-sm font-bold text-zinc-700 mb-1">Couldn't load Watchdog</p>
        <p className="text-xs text-zinc-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 text-white text-xs font-bold px-5 py-2.5"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5 pb-24">
      {/* Playful header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <motion.span
          className="inline-block text-5xl"
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          🛡️
        </motion.span>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
          Inflasi Watchdog
        </h1>
        <p className="text-xs text-zinc-400">
          Macro-Market Sentinel
          {dashboard && ` · ${formatRM(dashboard.total_monthly_spend_rm)}/mo`}
        </p>
      </motion.div>

      {/* Heat bar */}
      {dashboard && (
        <SentinelHeatBar heat={dashboard.sentinel_heat} mood={dashboard.market_mood} />
      )}

      {/* Active event banner */}
      {dashboard && dashboard.active_event && (
        <ActiveEventBanner event={dashboard.active_event} />
      )}

      {/* Spending breakdown */}
      {dashboard && dashboard.spending_snapshots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="text-sm font-bold text-zinc-700">Spending Breakdown</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dashboard.spending_snapshots.map((snapshot) => (
              <SpendingCategoryCard
                key={snapshot.category}
                snapshot={snapshot}
                isHighlighted={snapshot.sensitivity_score > 60}
              />
            ))}
          </div>
        </div>
      )}

      {/* Risk profile */}
      {dashboard && <RiskProfileCard profile={dashboard.risk_profile} />}

      {/* Quests */}
      <QuestPanel quests={quests} onComplete={handleCompleteQuest} />

      {/* Simulator */}
      <AdminSimulatorPanel onSimulate={handleSimulate} loading={simulating} />

      {/* Alert modal */}
      <MacroAlertModal
        impact={impact}
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
