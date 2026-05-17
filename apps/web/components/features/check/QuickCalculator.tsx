"use client";

import { useState } from "react";
import { NumPad } from "./NumPad";
import { CategoryPicker } from "./CategoryPicker";
import { BudgetImpactBar } from "./BudgetImpactBar";
import { checkSpend } from "@/lib/api";
import type { BudgetSummary, CheckResponse } from "@/types";
import type { CategoryId } from "@/lib/constants";
import { Loader2, AlertCircle } from "lucide-react";

interface QuickCalculatorProps {
  budget: BudgetSummary | null;
  onResult: (result: CheckResponse) => void;
}

export function QuickCalculator({ budget, onResult }: QuickCalculatorProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("shopping");
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await checkSpend({
        amount: parseFloat(amount),
        category,
        merchant: merchant || "Unknown",
      });
      onResult(res);
    } catch (err) {
      console.error("Quick check failed:", err);
      setError("API unreachable. Please start the backend server and try again.");
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

      {/* Budget impact preview — real remaining from DB */}
      {amount && parseFloat(amount) > 0 && budget && (
        <BudgetImpactBar amount={parseFloat(amount)} remaining={budget.remaining} />
      )}
      {amount && parseFloat(amount) > 0 && !budget && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950 px-3 py-2">
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Budget data unavailable — impact preview needs backend connection
          </p>
        </div>
      )}

      {/* Numpad */}
      <NumPad value={amount} onChange={setAmount} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950 p-3">
          <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            {error}
          </p>
        </div>
      )}

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
