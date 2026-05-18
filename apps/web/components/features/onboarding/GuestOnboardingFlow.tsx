"use client";

import React, { useState, useEffect } from "react";
import { useGuestMode } from "@/hooks/useGuestMode";
import { OnboardingChat } from "./OnboardingChat";
import { BankStatementUpload } from "./BankStatementUpload";
import { AnimatePresence, motion } from "framer-motion";
import type { OCRScanResponse, OCRTransaction } from "@/types";

interface GuestOnboardingFlowProps {
  onComplete: () => void;
}

export function GuestOnboardingFlow({ onComplete }: GuestOnboardingFlowProps) {
  const { guestData, updateGuestData } = useGuestMode();
  const [step, setStep] = useState<"questions" | "statement" | "analyzing" | "roast">("questions");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [persona, setPersona] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [scannedTxns, setScannedTxns] = useState<any[]>([]);

  useEffect(() => {
    if (guestData.onboarding?.questions_answered) {
      onComplete();
    }
  }, []);

  // ── Step 1: Questions complete → go to statement upload (no persona yet) ──

  const handleQuestionsComplete = (finalAnswers: Record<string, string>) => {
    setAnswers(finalAnswers);
    setTotalXP(60); // 5 questions x 12 XP

    updateGuestData(prev => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        questions_answered: true,
        answers: Object.entries(finalAnswers).map(([k, v], i) => ({
          question: i + 1,
          answer: v,
          xp: 12,
        })),
      },
      xp: prev.xp + 60,
    }));

    setStep("statement");
  };

  // ── Step 2: Statement uploaded → combined analysis with DeepSeek ──

  const handleStatementComplete = async (response: OCRScanResponse) => {
    const txns = response.scan_result?.transactions || [];
    const xpEarned = response.xp_earned || 0;
    setScannedTxns(txns);

    // Show analyzing animation while API runs
    setStep("analyzing");
    await new Promise(r => setTimeout(r, 200)); // let React paint

    // Call Agent 1 with Q&A + real transactions
    await runCombinedAnalysis(answers, txns, xpEarned, true);

    // Save transactions to guest state
    updateGuestData(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
      transactions: [
        ...txns.map((txn: any, i: number) => ({
          id: response.insert_results?.[i]?.transaction_id || Math.random().toString(36).substring(7),
          amount: txn.amount,
          category: txn.category,
          merchant: txn.merchant,
          note: txn.note || `Onboarding — ${txn.merchant}`,
          source: "onboarding",
          db_inserted: response.insert_results?.[i]?.db_inserted || false,
        })),
        ...prev.transactions,
      ],
    }));

    // Show persona — user taps anywhere to continue
  };

  // ── Step 2 alt: Statement skipped → analysis with Q&A only (lower confidence) ──

  const handleStatementSkip = async () => {
    setStep("analyzing");
    await new Promise(r => setTimeout(r, 200));
    await runCombinedAnalysis(answers, [], 0, false);
  };

  // ── Shared: call DeepSeek with Q&A [+ transactions] ──

  const runCombinedAnalysis = async (
    qa: Record<string, string>,
    txns: any[],
    extraXP: number,
    hasRealData: boolean
  ) => {
    let personaData: any = null;
    let budgetData: any = null;

    const apiPayload: any = {
      coffee_boba_weekly_estimate: qa.coffee_boba_weekly_estimate || "",
      impulse_category_lean: qa.impulse_category_lean || "",
      balance_check_behavior: qa.balance_check_behavior || "",
      late_night_impulse_tolerance: qa.late_night_impulse_tolerance || "",
      savings_disposition: qa.savings_disposition || "",
      transactions: txns.map(t => ({
        merchant: t.merchant || "",
        amount: t.amount || 0,
        category: t.category || "other",
      })),
    };

    try {
      const res = await fetch("/api/agent1/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("[AGENT 1] Response:", data.status, data.persona_code || "no code");
        if (data.status === "ok" && data.persona_code) {
          personaData = {
            from_api: true,
            has_real_data: hasRealData,
            name: data.persona_name,
            emoji: data.emoji || "🕵️",
            description: data.explanation,
            roast: data.roast || data.explanation,
            level: data.confidence >= 70 ? 2 : 1,
            signals: data.top_signals || [],
            confidence: data.confidence,
            raw: data.raw_analysis,
          };
          if (data.estimated_spending_profile && Object.keys(data.estimated_spending_profile).length > 0) {
            const profile = data.estimated_spending_profile;
            budgetData = [
              { category: "Food", amount: profile.food || 600, color: "#16a34a", percentage: 40 },
              { category: "Shopping", amount: profile.shopping || 350, color: "#2563eb", percentage: 25 },
              { category: "Transport", amount: profile.transport || 200, color: "#d97706", percentage: 15 },
              { category: "Bills", amount: profile.bills || 300, color: "#dc2626", percentage: 20 },
            ];
          }
        }
      }
    } catch (err: any) {
      console.error("[AGENT 1] API call failed:", err?.message || err);
      // API down or network error — use local fallback
    }

    if (!personaData) {
      personaData = calculateLocalPersona(qa);
      personaData.from_api = false;
    }
    if (!budgetData) {
      budgetData = generateEstimatedBudget(qa);
    }

    setPersona(personaData);
    setBudget(budgetData);
    setTotalXP(prev => prev + extraXP);

    // Save persona + budget to guest state
    updateGuestData(prev => ({
      ...prev,
      persona: personaData,
      estimated_budget: budgetData,
      xp: prev.xp + extraXP,
    }));

    // Debug dump
    const debugDump = {
      agent: "Agent 1 — Profile Scanner",
      data_sources: hasRealData
        ? "Q&A + bank statement transactions"
        : "Q&A only (no real transactions — confidence reduced)",
      answers: qa,
      transaction_count: txns.length,
      persona: personaData,
      estimated_budget: budgetData,
      note: personaData?.from_api
        ? "Assigned by DeepSeek AI (real API)"
        : "Assigned locally (API unavailable — using fallback rules)",
    };
    console.log("[AGENT 1] Combined analysis:", debugDump);

    setStep("roast");
  };

  // ── Helpers ──

  function calculateLocalPersona(ans: Record<string, string>) {
    const impulse = ans.late_night_impulse_tolerance === "buy";
    const guilt = ans.impulse_category_lean === "shopee";
    if (guilt && impulse) return { name: "Midnight Shopee Queen", emoji: "🛍️", description: "Late-night deals are your weakness.", roast: "Your Shopee cart has more items than a Mydin warehouse.", level: 1 };
    if (ans.coffee_boba_weekly_estimate === "over_50") return { name: "Boba Addict", emoji: "🧋", description: "You live for that sugar rush.", roast: "Your blood type is now Brown Sugar Syrup.", level: 1 };
    return { name: "Mamak Bro", emoji: "🍜", description: "Loyal to the local scene.", roast: "Your Nasi Kandar budget could fund a small warung.", level: 1 };
  }

  function generateEstimatedBudget(ans: Record<string, string>) {
    const bobaCost = ans.coffee_boba_weekly_estimate === "over_50" ? 300 : 150;
    return [
      { category: "Food", amount: 600 + bobaCost, color: "#16a34a", percentage: 40 },
      { category: "Shopping", amount: 350, color: "#2563eb", percentage: 25 },
      { category: "Transport", amount: 200, color: "#d97706", percentage: 15 },
      { category: "Bills", amount: 300, color: "#dc2626", percentage: 20 },
    ];
  }

  // ── Render ──

  return (
    <AnimatePresence mode="wait">
      {step === "questions" && (
        <motion.div key="questions" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
          className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]">
          <OnboardingChat onComplete={handleQuestionsComplete} />
        </motion.div>
      )}

      {step === "analyzing" && (
        <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]">
          <AnalyzingAnimation />
        </motion.div>
      )}

      {step === "statement" && (
        <motion.div key="statement" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
          className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]">
          <BankStatementUpload onComplete={handleStatementComplete} onSkip={handleStatementSkip} />
        </motion.div>
      )}

      {step === "roast" && persona && (
        <motion.div key="roast" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]">
          <PersonaSummary
            persona={persona}
            estimatedBudget={budget}
            xpEarned={totalXP}
            hasRealData={!!scannedTxns.length}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Agent analyzing animation ──

function AnalyzingAnimation() {
  const messages = [
    "Reading your financial DNA...",
    "Cross-referencing spending patterns...",
    "Comparing with 10,000 Malaysian profiles...",
    "Agent 1 is building your persona...",
    "Almost there...",
  ];
  const [msgIdx, setMsgIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center space-y-8">
      {/* Pulsing brain */}
      <div className="relative mx-auto w-32 h-32">
        <motion.div
          className="absolute inset-0 bg-primary/25 blur-2xl rounded-full"
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative flex h-full w-full items-center justify-center rounded-full border border-white/80 bg-white/90 text-5xl shadow-xl"
        >
          🧠
        </motion.div>
        {/* Orbiting dots */}
        {[0, 120, 240].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-brand"
            style={{ marginLeft: -6, marginTop: -6 }}
            animate={{
              x: [0, Math.cos((deg * Math.PI) / 180) * 60, 0],
              y: [0, Math.sin((deg * Math.PI) / 180) * 60, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      {/* Animated text */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Agent 1 analyzing your data</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-muted"
          >
            {messages[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Final persona summary — tap anywhere to continue to dashboard ──

function PersonaSummary({ persona, estimatedBudget, xpEarned, hasRealData }: any) {
  const [countdown, setCountdown] = React.useState(5);

  React.useEffect(() => {
    const timer = setInterval(() => setCountdown(n => n - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Auto-redirect after 5s
  React.useEffect(() => {
    if (countdown <= 0) goToDashboard();
  }, [countdown]);

  return (
    <div
      onClick={goToDashboard}
      className="flex min-h-[100dvh] cursor-pointer flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] text-foreground"
    >
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="text-7xl">{persona.emoji}</motion.div>
        <div>
          <h2 className="text-3xl font-bold">{persona.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {hasRealData ? "Analyzed from your real spending data" : "Estimated from your answers"}
          </p>
          {persona.confidence && (
            <p className="mt-1 text-xs text-neutral">Confidence: {persona.confidence}%</p>
          )}
        </div>
        <p className="max-w-sm text-lg italic text-foreground">"{persona.roast}"</p>

        {estimatedBudget && (
          <div className="w-full max-w-xs space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted">Estimated Monthly Spending</p>
            {estimatedBudget.slice(0, 4).map((item: any) => (
              <div key={item.category} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-left text-foreground">{item.category}</span>
                <span className="text-muted">RM{item.amount}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm font-semibold text-primary-dark">+{xpEarned} XP earned</div>
        <p className="text-xs text-muted">Tap anywhere or wait {countdown > 0 ? `${countdown}s` : "..."}</p>
      </div>
    </div>
  );
}
