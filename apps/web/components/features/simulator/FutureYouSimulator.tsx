"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { simulateFutureYou } from "@/lib/api";
import type { FutureYouRequest, FutureYouResponse } from "@/types";

const DEFAULT_REQUEST: FutureYouRequest = {
  question: "Should I buy a RM3,500 iPhone on BNPL?",
  purchase_amount: 3500,
  purchase_name: "iPhone",
  monthly_income: 3200,
  current_balance: 340,
  monthly_expenses: 2100,
  monthly_savings_contribution: 150,
  emergency_fund: 800,
  bnpl_monthly_payment: 0,
  bnpl_months: 6,
};

const FALLBACK_RESPONSE: FutureYouResponse = {
  verdict: "Skip or delay the purchase. BNPL is the weakest future here.",
  summary:
    "Saving first or skipping the purchase leaves Sarah with more runway, a stronger emergency buffer, and meaningfully lower stress over 6 months.",
  recommended_scenario_id: "skip_and_save",
  scenarios: [
    {
      id: "buy_now_bnpl",
      title: "A. Buy now with BNPL",
      description: "Take the iPhone now and spread the pain across six months.",
      six_month_cashflow: [
        { month: "Month 1", cashflow_end_balance: 857, savings_balance: 337.5, emergency_fund_balance: 800, bnpl_remaining: 2916.67 },
        { month: "Month 2", cashflow_end_balance: 1373.67, savings_balance: 375, emergency_fund_balance: 800, bnpl_remaining: 2333.33 },
        { month: "Month 3", cashflow_end_balance: 1890.34, savings_balance: 412.5, emergency_fund_balance: 800, bnpl_remaining: 1750 },
        { month: "Month 4", cashflow_end_balance: 2407.01, savings_balance: 450, emergency_fund_balance: 800, bnpl_remaining: 1166.67 },
        { month: "Month 5", cashflow_end_balance: 2923.68, savings_balance: 487.5, emergency_fund_balance: 800, bnpl_remaining: 583.33 },
        { month: "Month 6", cashflow_end_balance: 3440.35, savings_balance: 525, emergency_fund_balance: 800, bnpl_remaining: 0 },
      ],
      bnpl_burden: 583.33,
      emergency_fund_impact: 630,
      savings_impact: 375,
      stress_score: 78,
      recommendation: "Highest convenience, highest recurring stress.",
    },
    {
      id: "save_first",
      title: "B. Save RM500/month first",
      description: "Delay the purchase and build the phone fund deliberately before buying.",
      six_month_cashflow: [
        { month: "Month 1", cashflow_end_balance: 940, savings_balance: 800, emergency_fund_balance: 800, bnpl_remaining: 0 },
        { month: "Month 2", cashflow_end_balance: 1540, savings_balance: 1300, emergency_fund_balance: 800, bnpl_remaining: 0 },
        { month: "Month 3", cashflow_end_balance: 2140, savings_balance: 1800, emergency_fund_balance: 800, bnpl_remaining: 0 },
        { month: "Month 4", cashflow_end_balance: 2740, savings_balance: 2300, emergency_fund_balance: 800, bnpl_remaining: 0 },
        { month: "Month 5", cashflow_end_balance: 3340, savings_balance: 2800, emergency_fund_balance: 800, bnpl_remaining: 0 },
        { month: "Month 6", cashflow_end_balance: 440, savings_balance: 0, emergency_fund_balance: 800, bnpl_remaining: 0 },
      ],
      bnpl_burden: 0,
      emergency_fund_impact: 0,
      savings_impact: 3500,
      stress_score: 38,
      recommendation: "Most balanced path if the purchase still matters.",
    },
    {
      id: "skip_and_save",
      title: "C. Skip purchase and invest/save instead",
      description: "Keep the current phone longer and convert the urge into savings momentum.",
      six_month_cashflow: [
        { month: "Month 1", cashflow_end_balance: 940, savings_balance: 800, emergency_fund_balance: 1000, bnpl_remaining: 0 },
        { month: "Month 2", cashflow_end_balance: 1540, savings_balance: 1300, emergency_fund_balance: 1200, bnpl_remaining: 0 },
        { month: "Month 3", cashflow_end_balance: 2140, savings_balance: 1800, emergency_fund_balance: 1400, bnpl_remaining: 0 },
        { month: "Month 4", cashflow_end_balance: 2740, savings_balance: 2300, emergency_fund_balance: 1600, bnpl_remaining: 0 },
        { month: "Month 5", cashflow_end_balance: 3340, savings_balance: 2800, emergency_fund_balance: 1800, bnpl_remaining: 0 },
        { month: "Month 6", cashflow_end_balance: 3940, savings_balance: 3300, emergency_fund_balance: 2000, bnpl_remaining: 0 },
      ],
      bnpl_burden: 0,
      emergency_fund_impact: -1200,
      savings_impact: 3000,
      stress_score: 22,
      recommendation: "Lowest stress and strongest future position.",
    },
  ],
};

function formatRM(amount: number) {
  return `RM${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function FutureYouSimulator() {
  const [data, setData] = useState<FutureYouResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simulateFutureYou(DEFAULT_REQUEST)
      .then(setData)
      .catch(() => setData(FALLBACK_RESPONSE))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    const byMonth = data.scenarios[0]?.six_month_cashflow.map((point, index) => ({
      month: point.month,
      buy_now_bnpl: data.scenarios[0]?.six_month_cashflow[index]?.cashflow_end_balance ?? 0,
      save_first: data.scenarios[1]?.six_month_cashflow[index]?.cashflow_end_balance ?? 0,
      skip_and_save: data.scenarios[2]?.six_month_cashflow[index]?.cashflow_end_balance ?? 0,
    }));
    return byMonth ?? [];
  }, [data]);

  if (loading || !data) {
    return <div className="px-4 py-6">Loading future simulation...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-dark">
          Future Simulator
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950">
          {DEFAULT_REQUEST.question}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-600">{data.summary}</p>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">6-month cashflow timeline</p>
            <p className="text-xs text-zinc-500">Animated view of balance outcomes across all three futures.</p>
          </div>
          <div className="rounded-full border border-brand/25 bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark">
            Final AI verdict
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-80 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bnplFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BA6200" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#BA6200" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="saveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="skipFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#944E00" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#944E00" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#52525b" }} />
              <YAxis tickFormatter={(value) => `RM${value}`} tick={{ fontSize: 12, fill: "#52525b" }} width={52} />
              <Tooltip formatter={(value) => formatRM(Number(value))} />
              <Legend />
              <Area type="monotone" dataKey="buy_now_bnpl" name="Buy now" stroke="#BA6200" fill="url(#bnplFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="save_first" name="Save first" stroke="#D97706" fill="url(#saveFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="skip_and_save" name="Skip and save" stroke="#944E00" fill="url(#skipFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {data.scenarios.map((scenario, index) => {
          const recommended = scenario.id === data.recommended_scenario_id;
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className={`rounded-lg border p-5 ${
                recommended
                  ? "border-brand/35 bg-brand-light/60"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-950">{scenario.title}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      scenario.stress_score >= 70
                        ? "bg-red-100 text-red-700"
                        : scenario.stress_score >= 40
                        ? "bg-amber-100 text-amber-700"
                        : "bg-brand-muted text-brand-dark"
                    }`}
                  >
                    Stress {scenario.stress_score}
                  </span>
                </div>
                <p className="text-sm leading-6 text-zinc-600">{scenario.description}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-500">BNPL burden</p>
                  <p className="mt-1 font-semibold text-zinc-950">{formatRM(scenario.bnpl_burden)}/mo</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-500">Emergency fund impact</p>
                  <p className="mt-1 font-semibold text-zinc-950">{formatRM(scenario.emergency_fund_impact)}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-500">Savings impact</p>
                  <p className="mt-1 font-semibold text-zinc-950">{formatRM(scenario.savings_impact)}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-500">6-month end balance</p>
                  <p className="mt-1 font-semibold text-zinc-950">
                    {formatRM(scenario.six_month_cashflow[scenario.six_month_cashflow.length - 1]?.cashflow_end_balance ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Recommendation</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700">{scenario.recommendation}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-brand/25 bg-[#1C140C] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-on-hero">Final AI verdict</p>
        <p className="mt-2 text-lg font-semibold">{data.verdict}</p>
      </div>
    </div>
  );
}
