"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { API_URL } from "@/lib/constants";

interface OnboardingRoast {
  persona_name: string;
  persona_emoji: string;
  roast: string;
  encouragement: string;
  estimated_monthly_waste: string;
  top_weakness: string;
  ai_tip: string;
}

const QUESTIONS = [
  {
    field: "coffee_weekly",
    text: "How much do you usually spend on coffee or drinks per week? ☕",
    type: "text" as const,
  },
  {
    field: "guilt_purchase",
    text: "What's your biggest guilt purchase? Be honest! 😅",
    type: "text" as const,
  },
  {
    field: "salary_day",
    text: "What's the FIRST thing you do when salary hits? 💰",
    type: "text" as const,
  },
  {
    field: "saving_style",
    text: "Be honest — are you more of a saver or a spender?",
    type: "options" as const,
    options: [
      "Natural Saver 💪",
      "Spender (trying to change) 😅",
      "Depends on my mood 😂",
      "What's saving? 😬",
    ],
  },
  {
    field: "money_goal",
    text: "What's your #1 money goal right now? 🎯",
    type: "options" as const,
    options: [
      "Build emergency fund",
      "Pay off debt",
      "Save for something big",
      "Just stop bleeding money",
    ],
  },
];

export function ConversationalOnboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [phase, setPhase] = useState<"questions" | "loading" | "result">("questions");
  const [result, setResult] = useState<OnboardingRoast | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[step];

  async function submitAnswers(finalAnswers: Record<string, string>) {
    setPhase("loading");
    try {
      const res = await fetch(`${API_URL}/api/onboarding/roast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      const data: OnboardingRoast = await res.json();
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("questions");
    }
  }

  function handleNext() {
    if (!inputValue.trim()) return;
    const updated = { ...answers, [currentQuestion.field]: inputValue.trim() };
    setAnswers(updated);
    setInputValue("");
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submitAnswers(updated);
    }
  }

  function handleOption(option: string) {
    const updated = { ...answers, [currentQuestion.field]: option };
    setAnswers(updated);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submitAnswers(updated);
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] p-6 text-foreground">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-6xl mb-6"
        >
          🤔
        </motion.div>
        <p className="text-xl font-semibold text-primary-dark">
          BajetBuddy is analysing your vibe...
        </p>
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] p-6 text-foreground">
        <div className="w-full max-w-md space-y-6 py-10">
          {/* Persona emoji */}
          <motion.div
            className="text-center text-8xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {result.persona_emoji}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="mb-1 text-sm uppercase tracking-widest text-muted">You are...</p>
            <h1 className="text-2xl font-bold text-foreground">{result.persona_name}</h1>
          </motion.div>

          {/* Roast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl border border-white/80 bg-white/85 p-6"
          >
            <p className="mb-2 text-sm font-semibold text-tertiary-dark">The Roast 🔥</p>
            <p className="leading-relaxed text-foreground">{result.roast}</p>
          </motion.div>

          {/* Encouragement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6"
          >
            <p className="mb-2 text-sm font-semibold text-emerald-700">But here&apos;s the thing...</p>
            <p className="leading-relaxed text-emerald-900">{result.encouragement}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
              <p className="mb-1 text-xs text-muted">Monthly waste estimate</p>
              <p className="text-lg font-bold text-red-500">{result.estimated_monthly_waste}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4">
              <p className="mb-1 text-xs text-muted">Top weakness</p>
              <p className="text-sm font-semibold text-foreground">{result.top_weakness}</p>
            </div>
          </motion.div>

          {/* AI Tip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="rounded-2xl border border-secondary/20 bg-secondary-light p-4"
          >
            <p className="mb-1 text-xs font-semibold text-secondary-dark">💡 BajetBuddy&apos;s Tip</p>
            <p className="text-sm leading-relaxed text-secondary-dark">{result.ai_tip}</p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <a
              href="/dashboard"
              className="block w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-center font-bold text-white transition-colors hover:brightness-105"
            >
              Let&apos;s fix this together →
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] p-6 text-foreground">
      <div className="w-full max-w-md space-y-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === step ? "bg-primary" : i < step ? "bg-secondary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold leading-snug text-foreground">
              {currentQuestion.text}
            </h2>

            {currentQuestion.type === "text" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="Type your answer..."
                  className="w-full rounded-xl border border-white/80 bg-white/85 px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={handleNext}
                  disabled={!inputValue.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3 font-semibold text-white transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOption(option)}
                    className="rounded-xl border border-white/80 bg-white/85 px-3 py-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
