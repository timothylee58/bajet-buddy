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
    text: "How much do you spend on coffee / boba in a typical week?",
    key: "coffee_boba_weekly_estimate",
    options: [
      { label: "< RM20", value: "under_20" },
      { label: "RM20-50", value: "20_50" },
      { label: "> RM50", value: "over_50" },
    ],
  },
  {
    id: 2,
    text: "What's your biggest guilt purchase — the thing you buy then hide the receipt?",
    key: "impulse_category_lean",
    options: [
      { label: "Shopee haul", value: "shopee" },
      { label: "GrabFood", value: "grabfood" },
      { label: "Steam games", value: "gaming" },
      { label: "Sneakers", value: "fashion" },
    ],
  },
  {
    id: 3,
    text: "Do you check your bank balance before or after ordering GrabFood?",
    key: "balance_check_behavior",
    options: [
      { label: "Before", value: "before" },
      { label: "After", value: "after" },
      { label: "Never", value: "never" },
    ],
  },
  {
    id: 4,
    text: "Shopee sale notification at 2 AM — swipe buy or swipe ignore?",
    key: "late_night_impulse_tolerance",
    options: [
      { label: "Swipe buy", value: "buy" },
      { label: "Swipe ignore", value: "ignore" },
      { label: "Add to cart first", value: "cart" },
    ],
  },
  {
    id: 5,
    text: "If you found RM200 in your pocket right now, where would it go?",
    key: "savings_disposition",
    options: [
      { label: "Savings", value: "savings" },
      { label: "Treat myself", value: "spend" },
      { label: "Pay a bill", value: "bills" },
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
          <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-2.5 rounded-xl text-brand border border-zinc-700/50">
            <Brain size={22} />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-white tracking-wide">Profile Agent</h3>
          <p className="text-xs text-brand-light font-medium flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            Learning your style...
          </p>
        </div>
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
                  <div className="absolute inset-0 bg-brand blur-2xl rounded-full opacity-60 animate-pulse" />
                  <div className="relative h-24 w-24 bg-gradient-to-br from-brand to-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-zinc-950">
                    <Check size={48} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    All done!
                  </h2>
                  <p className="text-lg text-zinc-400">Calculating your persona and XP bonus...</p>
                </div>
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
