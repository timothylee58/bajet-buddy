"use client";

import React, { useState, useEffect } from "react";
import { useGuestMode } from "@/hooks/useGuestMode";
import { OCRPitchCard } from "./OCRPitchCard";
import { OnboardingChat } from "./OnboardingChat";
import { PersonaRoast } from "./PersonaRoast";

import { AnimatePresence, motion } from "framer-motion";

export function GuestOnboardingFlow() {
  const { guestData, updateGuestData, addXP } = useGuestMode();
  const [step, setStep] = useState<"pitch" | "questions" | "roast" | "none">("none");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (guestData.onboarding) {
      if (!guestData.onboarding.ocr_pitch_seen) {
        setStep("pitch");
      } else if (!guestData.onboarding.questions_answered && guestData.onboarding.answers.length === 0) {
        // If they saw the pitch but didn't answer questions yet (and didn't skip to app)
        // Actually if they skipped to app, we should probably not show questions.
        // Let's refine the logic.
      }
    }
  }, [guestData]);

  const handleSkipToQuestions = () => {
    updateGuestData(prev => ({
      ...prev,
      onboarding: { ...prev.onboarding, ocr_pitch_seen: true }
    }));
    setStep("questions");
  };

  const handleSkipToApp = () => {
    updateGuestData(prev => ({
      ...prev,
      onboarding: { 
        ...prev.onboarding, 
        ocr_pitch_seen: true,
        questions_answered: true 
      }
    }));
    setStep("none");
  };

  const handleScan = () => {
    // For now, just mark pitch as seen and we'll handle OCR later
    updateGuestData(prev => ({
      ...prev,
      onboarding: { ...prev.onboarding, ocr_pitch_seen: true }
    }));
    setStep("none"); // or go to scan screen
  };

  const handleQuestionsComplete = (finalAnswers: Record<string, string>) => {
    setAnswers(finalAnswers);
    
    // Calculate local persona
    const persona = calculateLocalPersona(finalAnswers);
    const budget = generateEstimatedBudget(finalAnswers);
    
    updateGuestData(prev => ({
      ...prev,
      onboarding: { 
        ...prev.onboarding, 
        questions_answered: true,
        answers: Object.entries(finalAnswers).map(([k, v], i) => ({ question: i + 1, answer: v, xp: 12 }))
      },
      persona,
      estimated_budget: budget,
      xp: prev.xp + 200 // 60 from questions + 140 bonus
    }));
    
    setStep("roast");
  };

  const handleEnterApp = () => {
    setStep("none");
  };

  return (
    <AnimatePresence mode="wait">
      {step === "pitch" && (
        <motion.div
          key="pitch"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-zinc-950"
        >
          <OCRPitchCard 
            onScan={handleScan}
            onSkipToQuestions={handleSkipToQuestions}
            onSkipToApp={handleSkipToApp}
          />
        </motion.div>
      )}
      
      {step === "questions" && (
        <motion.div
          key="questions"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-zinc-950"
        >
          <OnboardingChat onComplete={handleQuestionsComplete} />
        </motion.div>
      )}

      {step === "roast" && guestData.persona && (
        <motion.div
          key="roast"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-zinc-950"
        >
          <PersonaRoast 
            persona={guestData.persona}
            estimatedBudget={guestData.estimated_budget}
            xpEarned={200}
            onEnter={handleEnterApp}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Local Persona Calculation Helper
function calculateLocalPersona(answers: Record<string, string>) {
  const impulse = answers.late_night_impulse_tolerance === "buy";
  const guilt = answers.impulse_category_lean === "shopee";
  
  if (guilt && impulse) {
    return {
      name: "Midnight Shopee Queen",
      emoji: "🛍️",
      description: "You love late-night deals and flash sales.",
      roast: "Your Shopee cart has more items than a Mydin warehouse. Maybe put the phone down after midnight?",
      level: 1
    };
  }
  
  if (answers.coffee_boba_weekly_estimate === "over_50") {
    return {
      name: "Boba Addict",
      emoji: "🧋",
      description: "You live for that sugar rush.",
      roast: "You've spent enough on boba this month to buy the whole Tealive franchise. Your blood type is now Brown Sugar Syrup.",
      level: 1
    };
  }

  return {
    name: "Mamak Bro",
    emoji: "🍜",
    description: "Loyal to the local scene.",
    roast: "Your Nasi Kandar budget could fund a small warung. But hey, at least you're loyal to your mamak.",
    level: 1
  };
}

// Local Budget Estimation Helper
function generateEstimatedBudget(answers: Record<string, string>) {
  const bobaCost = answers.coffee_boba_weekly_estimate === "over_50" ? 300 : 150;
  
  return [
    { category: "Food", amount: 600 + bobaCost, color: "#16a34a", percentage: 40 },
    { category: "Shopping", amount: 350, color: "#2563eb", percentage: 25 },
    { category: "Transport", amount: 200, color: "#d97706", percentage: 15 },
    { category: "Bills", amount: 300, color: "#dc2626", percentage: 20 },
  ];
}
