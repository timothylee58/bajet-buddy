"use client";

import { useState } from "react";
import { NumPad } from "./NumPad";
import { CategoryPicker } from "./CategoryPicker";
import { VerdictOverlay } from "./VerdictOverlay";
import { BudgetImpactBar } from "./BudgetImpactBar";
import { VoiceInput } from "./VoiceInput";
import { checkSpend } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import type { CheckResponse, Verdict } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import type { CategoryId } from "@/lib/constants";

type Step = "amount" | "category" | "result";

const SARAH_DEMO = {
  amount: "189",
  category: "shopping" as CategoryId,
  merchant: "Shopee Malaysia",
};

function buildDemoResult(amount: number, category: CategoryId, merchant: string): CheckResponse {
  const isSarahScenario =
    amount === 189 &&
    category === "shopping" &&
    merchant.trim().toLowerCase().includes("shopee");

  if (isSarahScenario) {
    return {
      verdict: "jangan_dulu",
      nudge_bm:
        "Jangan dulu, Sarah. Anda ada RM340 untuk 7 hari. Selepas dress RM189 ini, baki tinggal RM151 atau sekitar RM21 sehari.",
      nudge_en:
        "Hold it, Sarah. You have RM340 for 7 days. After this RM189 dress, only RM151 is left, around RM21 a day.",
      risk_score: 92,
      budget_impact_pct: 56,
      xp_earned: 0,
      reason_codes: [
        "LOW_DAILY_SURVIVAL",
        "HIGH_CATEGORY_USAGE",
        "DISCRETIONARY_SHOPEE_PURCHASE",
      ],
      recommended_action: "Save to wishlist and review again after salary.",
      explanation:
        "This purchase pushes daily survival below RM25 and adds pressure late in Sarah's salary cycle.",
      tradeoff: "You get the dress now, but the next 7 days become tighter and more stressful.",
      alternative_action: "Save it to wishlist and revisit after payday or when the price drops.",
      cta_buttons: ["Save to Wishlist", "Review After Salary", "Compare Safer Options"],
      projected_remaining_balance: 151,
      projected_daily_survival_amount: 21.57,
      proactive_alert: true,
      proactive_trigger_reason: "Sarah is on day 18 of her salary cycle with only 7 days left.",
      persona: {
        type: "midnight_shopee_queen",
        name: "Midnight Shopee Queen",
        emoji: "🛍️",
        description: "Late-night impulse shopping clusters around payday runway stress.",
        confidence: 88,
      },
      freeze_status: {
        active: true,
        type: "soft",
        reason: "auto",
        message: "Soft freeze active until this impulse window passes.",
        can_override: true,
        override_cost_xp: 15,
      },
      pipeline_trace: [
        "observe_transaction_intent",
        "load_context",
        "evaluate_risk",
        "generate_nudge",
        "finalize_action",
      ],
    };
  }

  const mockVerdict: Verdict =
    amount > 150 ? "jangan_dulu" : amount > 80 ? "fikir_dulu" : "boleh";

  return {
    verdict: mockVerdict,
    nudge_bm:
      mockVerdict === "jangan_dulu"
        ? "Jangan dulu. Perbelanjaan ini akan tekan baki harian anda terlalu rendah."
        : mockVerdict === "fikir_dulu"
          ? "Fikir dulu sebelum beli. Semak sama ada ini betul-betul perlu."
          : "Boleh. Belanja ini masih nampak terkawal dalam demo semasa.",
    nudge_en:
      mockVerdict === "jangan_dulu"
        ? "Hold off. This spend pushes your daily runway too low."
        : mockVerdict === "fikir_dulu"
          ? "Think first. Check if this is really necessary."
          : "Go ahead. This spend still looks manageable in the current demo.",
    risk_score: amount > 150 ? 85 : amount > 80 ? 55 : 20,
    budget_impact_pct: (amount / 340) * 100,
    xp_earned: mockVerdict === "boleh" ? 10 : 0,
  };
}

interface CheckScreenProps {
  isSarahDemo?: boolean;
}

export function CheckScreen({ isSarahDemo = false }: CheckScreenProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(isSarahDemo ? SARAH_DEMO.amount : "");
  const [category, setCategory] = useState<CategoryId>(isSarahDemo ? SARAH_DEMO.category : "shopping");
  const [merchant, setMerchant] = useState(isSarahDemo ? SARAH_DEMO.merchant : "");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  function onVoiceParsed(parsed: { amount: string; merchant: string; category: string }) {
    if (parsed.amount) setAmount(parsed.amount);
    if (parsed.merchant) setMerchant(parsed.merchant);
    const validCategory = CATEGORIES.find((c) => c.id === parsed.category);
    if (validCategory) setCategory(validCategory.id as CategoryId);
  }

  function loadSarahDemo() {
    setAmount(SARAH_DEMO.amount);
    setCategory(SARAH_DEMO.category);
    setMerchant(SARAH_DEMO.merchant);
    setError(null);
  }

  async function handleCheck() {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError(null);
    if (isSarahDemo) {
      setResult(buildDemoResult(parseFloat(amount), category, merchant || "Unknown"));
      setStep("result");
      setLoading(false);
      return;
    }
    try {
      const res = await checkSpend({
        amount: parseFloat(amount),
        category,
        merchant: merchant || "Unknown",
      });
      setResult(res);
      setStep("result");
      const vLabel = res.verdict === "boleh" ? "Boleh!" : res.verdict === "fikir_dulu" ? "Fikir Dulu" : "Jangan Dulu";
      toastSuccess(`${vLabel} · Risk: ${res.risk_score}/100 · Impact: ${res.budget_impact_pct.toFixed(0)}%`);
    } catch {
      setResult(buildDemoResult(parseFloat(amount), category, merchant || "Unknown"));
      setStep("result");
      toastError(`API unavailable — showing demo result`, "API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("amount");
    setAmount("");
    setMerchant("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col h-full px-4 py-6 gap-6">
      {step === "result" && result ? (
        <VerdictOverlay result={result} amount={parseFloat(amount)} onReset={reset} />
      ) : (
        <>
          {isSarahDemo && (
            <div
              data-testid="sarah-demo-banner"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            >
              <p className="font-semibold">Sarah demo</p>
              <p className="mt-1 text-emerald-800">
                Day 18 of salary cycle. RM340 left for 7 days. Try the Shopee dress check.
              </p>
              <button
                type="button"
                onClick={loadSarahDemo}
                data-testid="load-sarah-demo-button"
                className="mt-3 rounded-xl bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Load Sarah demo
              </button>
            </div>
          )}

          {/* Amount display */}
          <div className="text-center" data-testid="amount-display">
            <p className="font-sans text-sm font-bold text-muted mb-1">How much are you spending?</p>
            <div className="font-headline text-5xl font-bold text-foreground tracking-tight">
              RM{amount || "0"}
            </div>
          </div>

          {/* Merchant input */}
          <input
            type="text"
            placeholder="Where? (e.g. Shopee, McDonald's)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            data-testid="merchant-input"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 font-sans text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />

          {/* Category picker */}
          <CategoryPicker selected={category} onChange={setCategory} />

          {/* Budget impact preview */}
          {amount && parseFloat(amount) > 0 && (
            <BudgetImpactBar amount={parseFloat(amount)} remaining={340} />
          )}

          {/* Voice input */}
          <VoiceInput onParsed={onVoiceParsed} />

          {/* Numpad */}
          <NumPad value={amount} onChange={setAmount} />

          {/* Check button */}
          <button
            onClick={handleCheck}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            data-testid="check-spend-button"
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 text-lg transition-colors"
          >
            {loading ? "Checking…" : "Check Spend ✅"}
          </button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
