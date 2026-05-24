"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MacroEventType } from "@/types";

const EVENTS: { type: MacroEventType; icon: string; label: string; emoji: string; desc: string }[] = [
  { type: "grain_spike", icon: "🌾", label: "Grain Spike", emoji: "🌾", desc: "Bread & rice prices ↑" },
  { type: "fuel_subsidy_cut", icon: "⛽", label: "Fuel Subsidy Cut", emoji: "⛽", desc: "Petrol price jumps" },
  { type: "logistics_surge", icon: "🚛", label: "Logistics Surge", emoji: "🚛", desc: "Shipping costs ↑" },
  { type: "currency_depreciation", icon: "💸", label: "Ringgit Drop", emoji: "💸", desc: "Imports get expensive" },
  { type: "electricity_tariff", icon: "⚡", label: "Electricity Tariff", emoji: "⚡", desc: "TNB rates go up" },
  { type: "palm_oil_shock", icon: "🌴", label: "Palm Oil Shock", emoji: "🌴", desc: "Cooking oil prices ↑" },
];

interface Props {
  onSimulate: (event: MacroEventType) => void;
  loading: boolean;
}

export function AdminSimulatorPanel({ onSimulate, loading }: Props) {
  const [selected, setSelected] = useState<MacroEventType>("grain_spike");
  const [justTriggered, setJustTriggered] = useState(false);

  const handleTrigger = () => {
    setJustTriggered(true);
    onSimulate(selected);
    setTimeout(() => setJustTriggered(false), 2000);
  };

  const activeEvent = EVENTS.find((e) => e.type === selected);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧪</span>
        <div>
          <p className="text-sm font-bold text-indigo-700">Simulation Lab</p>
          <p className="text-[10px] text-indigo-400">Trigger a market event to test your shield</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {EVENTS.map((e) => (
          <motion.button
            key={e.type}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(e.type)}
            className={`rounded-xl px-3 py-2.5 text-xs font-medium border transition-all text-left ${
              selected === e.type
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white/80 text-zinc-600 border-zinc-200 hover:border-indigo-300 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{e.icon}</span>
              <div className="min-w-0">
                <div className="font-semibold text-xs truncate">{e.label}</div>
                <div className={`text-[10px] truncate ${selected === e.type ? "text-white/70" : "text-zinc-400"}`}>
                  {e.desc}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {justTriggered ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>✅</span>
            <span>{activeEvent?.emoji} {activeEvent?.label} triggered!</span>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            whileTap={{ scale: 0.97 }}
            onClick={handleTrigger}
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>🚨</span>
                <span>Simulate {activeEvent?.label}</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-indigo-400 text-center mt-2">Simulation only — no real financial data</p>
    </div>
  );
}
