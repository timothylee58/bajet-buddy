"use client";

import { useEffect, useState } from "react";
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

export function SentinelDashboard() {
  const [dashboard, setDashboard] = useState<SentinelDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [impact, setImpact] = useState<SimulateEventResponse | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [quests, setQuests] = useState<InflationQuest[]>([]);

  useEffect(() => {
    getSentinelDashboard()
      .then((data) => {
        setDashboard(data);
        setQuests(data.quests);
      })
      .catch(() => {
        // silently fail — show empty state
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5 pb-24">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
          🛡️ Inflasi Watchdog
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Macro-Market Sentinel</p>
        {dashboard && (
          <p className="text-xs text-zinc-400 mt-0.5">
            Monthly spend: {formatRM(dashboard.total_monthly_spend_rm)}
          </p>
        )}
      </div>

      {dashboard && (
        <SentinelHeatBar heat={dashboard.sentinel_heat} mood={dashboard.market_mood} />
      )}

      {dashboard && dashboard.active_event && (
        <ActiveEventBanner event={dashboard.active_event} />
      )}

      {dashboard && dashboard.spending_snapshots.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-zinc-600 mb-2">Spending Breakdown</div>
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

      {dashboard && <RiskProfileCard profile={dashboard.risk_profile} />}

      <QuestPanel quests={quests} onComplete={handleCompleteQuest} />

      <AdminSimulatorPanel onSimulate={handleSimulate} loading={simulating} />

      <MacroAlertModal
        impact={impact}
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
