"use client";

import { useState } from "react";
import { NumPad } from "./NumPad";
import { CategoryPicker } from "./CategoryPicker";
import { BudgetImpactBar } from "./BudgetImpactBar";
import { checkSpend } from "@/lib/api";
import type { CheckResponse } from "@/types";
import type { CategoryId } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface QuickCalculatorProps {
  onResult: (result: CheckResponse) => void;
}

function buildDemoResult(amount: number, category: CategoryId, merchant: string): CheckResponse {
  const mockVerdict = amount > 150 ? "jangan_dulu" as const : amount > 80 ? "fikir_dulu" as const : "boleh" as const;

  return {
    verdict: mockVerdict,
    nudge_bm:
      mockVerdict === "jangan_dulu"
        ? "Jangan dulu. Perbelanjaan ini akan tekan baki harian anda terlalu rendah."
        : mockVerdict === "fikir_dulu"
          ? "Fikir dulu sebelum beli. Semak sama ada ini betul-betul perlu."
          : "Boleh. Belanja ini masih nampak terkawal.",
    nudge_en:
      mockVerdict === "jangan_dulu"
        ? "Hold off. This spend pushes your daily runway too low."
        : mockVerdict === "fikir_dulu"
          ? "Think first. Check if this is really necessary."
          : "Go ahead. This spend still looks manageable.",
    risk_score: amount > 150 ? 85 : amount > 80 ? 55 : 20,
    budget_impact_pct: (amount / 340) * 100,
    xp_earned: mockVerdict === "boleh" ? 10 : 0,
    reason_codes: mockVerdict === "jangan_dulu" ? ["LOW_DAILY_SURVIVAL", "HIGH_CATEGORY_USAGE"] : [],
    projected_remaining_balance: 340 - amount,
    projected_daily_survival_amount: (340 - amount) / 7,
    proactive_alert: amount > 150,
  };
}

export function QuickCalculator({ onResult }: QuickCalculatorProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("shopping");
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const res = await checkSpend({
        amount: parseFloat(amount),
        category,
        merchant: merchant || "Unknown",
      });
      onResult(res);
    } catch {
      onResult(buildDemoResult(parseFloat(amount), category, merchant || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide text-center">
        Quick Calculator
      </p>

      {/* Amount display */}
      <div className="text-center">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          RM{amount || "0"}
        </div>
      </div>

      {/* Merchant input */}
      <input
        type="text"
        placeholder="Where? (e.g. Shopee, McDonald's)"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {/* Category picker */}
      <CategoryPicker selected={category} onChange={setCategory} />

      {/* Budget impact preview */}
      {amount && parseFloat(amount) > 0 && (
        <BudgetImpactBar amount={parseFloat(amount)} remaining={340} />
      )}

      {/* Numpad */}
      <NumPad value={amount} onChange={setAmount} />

      {/* Check button */}
      <button
        onClick={handleCheck}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking…
          </>
        ) : (
          "Check Spend ✅"
        )}
      </button>
    </div>
  );
}
