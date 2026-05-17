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
    <div className="flex flex-col min-h-[100dvh] bg-zinc-950 text-white selection:bg-brand/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-brand/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="bg-zinc-950/80 backdrop-blur-xl p-4 pt-10 border-b border-zinc-800/50 flex items-center gap-4 sticky top-0 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-brand blur-md rounded-full opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-2.5 rounded-xl text-brand border border-zinc-700/50 text-2xl">
            🕵️
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white tracking-wide">Agent 1 · Profile Scanner</h3>
          <p className="text-xs text-brand-light font-medium flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
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
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1"
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
                  <div className="inline-block px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-light">
                      Question {currentStep + 1} of 5
                    </span>
                  </div>
                  <h2 className="text-3xl font-semibold text-white leading-tight">
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
                        className="w-full justify-start h-auto py-5 px-6 text-left bg-zinc-900/50 border-zinc-800 hover:border-brand/50 hover:bg-zinc-800 rounded-2xl transition-all group shadow-lg overflow-hidden relative"
                        onClick={() => handleAnswer(option.value)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand/0 via-brand/5 to-brand/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                        <span className="flex-1 text-lg font-medium text-zinc-300 group-hover:text-white transition-colors relative z-10">
                          {option.label}
                        </span>
                        <ArrowRight size={20} className="text-zinc-600 group-hover:text-brand transition-colors relative z-10" />
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
                    className="relative h-28 w-28 bg-gradient-to-br from-brand to-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-zinc-950 text-5xl"
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
                  <h2 className="text-3xl font-bold text-white">Answers collected!</h2>
                  <p className="text-zinc-400">Now let&apos;s see your real spending data...</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-2 text-xs text-zinc-500"
                >
                  <span className="px-2 py-1 rounded-full bg-zinc-800">+60 XP</span>
                  <span className="px-2 py-1 rounded-full bg-zinc-800">Step 1/2 complete</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 pb-10 mt-auto pt-8">
          <div className="flex justify-between items-center text-xs text-zinc-500 font-bold tracking-widest">
            <span>PROGRESS</span>
            <span className="text-brand-light">{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand via-emerald-400 to-brand bg-[length:200%_100%] animate-[gradient_2s_linear_infinite]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                +12 XP earned per answer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
