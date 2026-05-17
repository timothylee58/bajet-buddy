"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MacroEventType } from "@/types";

const EVENTS: { type: MacroEventType; icon: string; label: string }[] = [
  { type: "grain_spike", icon: "🌾", label: "Grain Spike" },
  { type: "fuel_subsidy_cut", icon: "⛽", label: "Fuel Subsidy Cut" },
  { type: "logistics_surge", icon: "🚛", label: "Logistics Surge" },
  { type: "currency_depreciation", icon: "💸", label: "Ringgit Drop" },
  { type: "electricity_tariff", icon: "⚡", label: "Electricity Tariff" },
  { type: "palm_oil_shock", icon: "🌴", label: "Palm Oil Shock" },
];

interface Props {
  onSimulate: (event: MacroEventType) => void;
  loading: boolean;
}

export function AdminSimulatorPanel({ onSimulate, loading }: Props) {
  const [selected, setSelected] = useState<MacroEventType>("grain_spike");

  return (
    <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-3xl p-5">
      <div className="text-sm font-bold text-indigo-700 mb-3">🧪 Admin / Simulation Panel</div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {EVENTS.map((e) => (
          <button
            key={e.type}
            onClick={() => setSelected(e.type)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border transition-all",
              selected === e.type
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300"
            )}
          >
            <span>{e.icon}</span>
            <span>{e.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onSimulate(selected)}
        disabled={loading}
        className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <span>🚨 Simulate Market Shift Alert</span>
        )}
      </button>
      <p className="text-xs text-indigo-400 text-center mt-2">Simulation only — no real financial data</p>
    </div>
  );
}
