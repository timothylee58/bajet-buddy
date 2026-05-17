"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSentinelDashboard, simulateMacroEvent, completeSentinelQuest, awardPetXP } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import type { SentinelDashboardResponse, SimulateEventResponse, MacroEventType, InflationQuest } from "@/types";
import { SentinelHeatBar } from "./SentinelHeatBar";
import { SpendingCategoryCard } from "./SpendingCategoryCard";
import { RiskProfileCard } from "./RiskProfileCard";
import { ActiveEventBanner } from "./ActiveEventBanner";
import { QuestPanel } from "./QuestPanel";
import { AdminSimulatorPanel } from "./AdminSimulatorPanel";
import { MacroAlertModal } from "./MacroAlertModal";
import { CommodityCard, type CommodityData } from "./CommodityCard";
import { MarketTicker } from "./MarketTicker";
import { SentinelReasoningTrace } from "./SentinelReasoningTrace";
import { formatRM, cn } from "@/lib/utils";
import { Loader2, RefreshCw, TrendingUp, Shield, LayoutDashboard, BarChart3 } from "lucide-react";

type TabId = "commodities" | "dashboard";

export function SentinelDashboard() {
  const [dashboard, setDashboard] = useState<SentinelDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<SimulateEventResponse | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [quests, setQuests] = useState<InflationQuest[]>([]);
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [totalImpact, setTotalImpact] = useState<number>(0);
  const [tab, setTab] = useState<TabId>("commodities");

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

  // Auto-scan on mount
  useEffect(() => { handleScan(); }, []);

  async function handleScan() {
    setScanning(true);
    try {
      const res = await fetch(`${API_URL}/api/sentinel/scan`, { method: "POST" });
      const data = await res.json();
      setCommodities(data.commodities || []);
      setScanSummary(data.summary || "");
      setTotalImpact(data.totalMonthlyImpact || 0);
    } catch { /* ignore */ } finally { setScanning(false); }
  }

  async function handleSimulate(event_type: MacroEventType) {
    setSimulating(true);
    try {
      const result = await simulateMacroEvent(event_type);
      setImpact(result);
      setAlertOpen(true);
      if (result.quests_generated.length > 0) {
        setQuests((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const newQuests = result.quests_generated.filter((q) => !existingIds.has(q.id));
          return [...newQuests, ...prev];
        });
      }
    } finally { setSimulating(false); }
  }

  async function handleCompleteQuest(questId: string) {
    try {
      await completeSentinelQuest(questId);
      setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, completed: true } : q)));
      awardPetXP({ event: "goal_complete" }).catch(() => {});
    } catch { /* ignore */ }
  }

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">😵</span>
        <p className="text-sm font-bold text-zinc-700 mb-1">Couldn't load Sentinel</p>
        <p className="text-xs text-zinc-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-indigo-600 text-white text-xs font-bold px-5 py-2.5">Try again</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-0 pb-24">
      <MarketTicker />

      <div className="px-4 py-6 flex flex-col gap-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1">
          <span className="inline-block text-4xl">🤖</span>
          <h1 className="text-2xl font-black text-zinc-900">
            Agent 5: Harga Sentinel
          </h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Macro-Market Intelligence
          </p>
        </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-zinc-100 p-1">
        {([
          { id: "commodities" as TabId, label: "Harga Watch", icon: TrendingUp },
          { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              tab === t.id
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Shared: Heat gauge + active event */}
      {dashboard && <SentinelHeatBar heat={dashboard.sentinel_heat} mood={dashboard.market_mood} />}
      
      {/* AI Logic Trace */}
      <SentinelReasoningTrace />

      {dashboard && dashboard.active_event && <ActiveEventBanner event={dashboard.active_event} />}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "commodities" && (
          <CommoditiesTab
            key="commodities"
            scanSummary={scanSummary}
            totalImpact={totalImpact}
            scanning={scanning}
            commodities={commodities}
            onScan={handleScan}
          />
        )}
        {tab === "dashboard" && dashboard && (
          <DashboardTab key="dashboard" dashboard={dashboard} />
        )}
      </AnimatePresence>

      {/* Shared: Quests */}
      <QuestPanel quests={quests} onComplete={handleCompleteQuest} />

      {/* Shared: Simulator + Alert */}
      <AdminSimulatorPanel onSimulate={handleSimulate} loading={simulating} />
      <MacroAlertModal impact={impact} open={alertOpen} onClose={() => setAlertOpen(false)} />
      </div>
    </div>
  );
}

// ─── Commodities Tab ─────────────────────────────────────────────────────

function CommoditiesTab({
  scanSummary, totalImpact, scanning, commodities, onScan,
}: {
  scanSummary: string | null; totalImpact: number; scanning: boolean;
  commodities: CommodityData[]; onScan: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
      {scanSummary && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-indigo-700 mb-1">AI Market Scan Complete</p>
              <p className="text-xs text-indigo-600/80 leading-relaxed">{scanSummary}</p>
            </div>
          </div>
          {totalImpact > 0 && (
            <div className="mt-3 flex items-center justify-between bg-white/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-medium text-red-500">Est. monthly impact</span>
              <span className="text-sm font-extrabold text-red-600">+{formatRM(totalImpact)}</span>
            </div>
          )}
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-bold text-zinc-700">Tracked Commodities</span>
          </div>
          <button onClick={onScan} disabled={scanning}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Scan
          </button>
        </div>
        {scanning && commodities.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-zinc-200 rounded-full" /><div className="space-y-1"><div className="h-3 w-24 bg-zinc-200 rounded" /><div className="h-2 w-16 bg-zinc-100 rounded" /></div></div>
                  <div className="h-5 w-16 bg-zinc-200 rounded-full" />
                </div>
                <div className="h-8 bg-zinc-100 rounded-xl mb-2" /><div className="h-2 bg-zinc-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {commodities.map((c, i) => <CommodityCard key={c.id} commodity={c} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────

function DashboardTab({ dashboard }: { dashboard: SentinelDashboardResponse }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
      {dashboard.spending_snapshots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="text-sm font-bold text-zinc-700">Spending Breakdown</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dashboard.spending_snapshots.map((snapshot) => (
              <SpendingCategoryCard key={snapshot.category} snapshot={snapshot} isHighlighted={snapshot.sensitivity_score > 60} />
            ))}
          </div>
        </div>
      )}
      <RiskProfileCard profile={dashboard.risk_profile} />
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-zinc-200 rounded-2xl mx-auto animate-pulse" />
        <div className="h-4 w-40 bg-zinc-200 rounded mx-auto animate-pulse" />
        <div className="h-3 w-24 bg-zinc-200 rounded mx-auto animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-zinc-200 rounded-full" /><div className="space-y-1"><div className="h-3 w-24 bg-zinc-200 rounded" /><div className="h-2 w-16 bg-zinc-100 rounded" /></div></div>
            <div className="h-5 w-16 bg-zinc-200 rounded-full" />
          </div>
          <div className="h-8 bg-zinc-100 rounded-xl mb-2" /><div className="h-2 bg-zinc-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}
