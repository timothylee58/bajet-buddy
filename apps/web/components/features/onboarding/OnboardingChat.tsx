"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  text: string;
  key: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Be honest — your monthly boba / kopi budget is actually...",
    key: "coffee_boba_weekly_estimate",
    options: [
      { label: "I'm a RM5 kopi-o person", value: "under_20" },
      { label: "Brown sugar milk tea owns me", value: "20_50" },
      { label: "Tealive should give me shares", value: "over_50" },
    ],
  },
  {
    id: 2,
    text: "That one purchase you NEVER tell your friends about...",
    key: "impulse_category_lean",
    options: [
      { label: "Shopee 12AM flash sale", value: "shopee" },
      { label: "GrabFood at 3AM", value: "grabfood" },
      { label: "Steam sale backlog games", value: "gaming" },
      { label: "That limited-edition sneaker drop", value: "fashion" },
    ],
  },
  {
    id: 3,
    text: "When was the last time you checked your bank balance before swiping your card?",
    key: "balance_check_behavior",
    options: [
      { label: "Just now — I'm paranoid", value: "before" },
      { label: "After the 'insufficient funds' jump scare", value: "after" },
      { label: "What's a bank balance 😭", value: "never" },
    ],
  },
  {
    id: 4,
    text: "It's 12:30 AM. Shopee live says 'Last stock RM19 only!' You...",
    key: "late_night_impulse_tolerance",
    options: [
      { label: "CHECKOUT. No questions asked.", value: "buy" },
      { label: "Close the app. I have discipline.", value: "ignore" },
      { label: "Add to cart then forget for 3 days", value: "cart" },
    ],
  },
  {
    id: 5,
    text: "Your TNG e-wallet suddenly has RM200 extra. What happens next?",
    key: "savings_disposition",
    options: [
      { label: "Straight to Tabung savings 💪", value: "savings" },
      { label: "Treat the whole gang to mamak 🍜", value: "spend" },
      { label: "Pay that one bill I've been avoiding", value: "bills" },
    ],
  },
];

interface OnboardingChatProps {
  onComplete: (answers: Record<string, string>) => void;
}

export function OnboardingChat({ onComplete }: OnboardingChatProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinishing(true);
      setTimeout(() => onComplete(newAnswers), 1500);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(79,195,247,0.14),_transparent_24rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] text-foreground selection:bg-primary/25">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-brand/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/70 bg-white/80 p-4 pt-10 backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-brand blur-md rounded-full opacity-50 animate-pulse" />
          <div className="relative rounded-xl border border-white/80 bg-white p-2.5 text-2xl text-primary shadow-lg">
            🕵️
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold tracking-wide text-foreground">Agent 1 · Profile Scanner</h3>
          <p className="text-xs font-medium text-primary-dark flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Reading your financial aura...
          </p>
        </div>
        {!isFinishing && (
          <button
            onClick={() => {
              setIsFinishing(true);
              setTimeout(() => onComplete(answers), 800);
            }}
            className="px-2 py-1 text-xs text-muted hover:text-primary-dark"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full relative z-10">
        <div className="flex-1 flex flex-col justify-center min-h-[300px]">
          <AnimatePresence mode="wait">
            {!isFinishing ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="space-y-3">
                    <div className="inline-block rounded-full border border-primary/20 bg-primary-light px-3 py-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary-dark">
                      Question {currentStep + 1} of 5
                    </span>
                  </div>
                  <h2 className="text-3xl font-semibold leading-tight text-foreground">
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className="grid gap-3">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="relative h-auto w-full justify-start overflow-hidden rounded-2xl border-white/80 bg-white/85 px-6 py-5 text-left shadow-lg transition-all group"
                        onClick={() => handleAnswer(option.value)}
                      >
                        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-primary/0 via-primary/10 to-secondary/10 transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
                        <span className="relative z-10 flex-1 text-lg font-medium text-foreground transition-colors group-hover:text-primary-dark">
                          {option.label}
                        </span>
                        <ArrowRight size={20} className="relative z-10 text-muted transition-colors group-hover:text-primary" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6"
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-brand blur-3xl rounded-full opacity-60"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white text-5xl text-white shadow-2xl bg-gradient-to-br from-primary via-secondary to-tertiary"
                  >
                    🎉
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <h2 className="text-3xl font-bold text-foreground">Answers collected!</h2>
                  <p className="text-muted">Now let's really see how you spend...</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-2 text-xs text-muted"
                >
                  <span className="rounded-full bg-primary-light px-2 py-1 text-primary-dark">+60 XP</span>
                  <span className="rounded-full bg-secondary-light px-2 py-1 text-secondary-dark">Step 1/2 complete</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 pb-10 mt-auto pt-8">
          <div className="flex items-center justify-between text-xs font-bold tracking-widest text-muted">
            <span>PROGRESS</span>
            <span className="text-primary-dark">{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border border-white/80 bg-white/80 shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary bg-[length:200%_100%] animate-[gradient_2s_linear_infinite]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/85 px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                +12 XP earned per answer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
