"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface PersonaRoastProps {
  persona: {
    name: string;
    emoji: string;
    description: string;
    roast: string;
    level: number;
  };
  estimatedBudget: {
    category: string;
    amount: number;
    color: string;
    percentage: number;
  }[];
  xpEarned: number;
  onEnter: () => void;
}

export function PersonaRoast({
  persona,
  estimatedBudget,
  xpEarned,
  onEnter,
}: PersonaRoastProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.18),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(79,195,247,0.14),_transparent_24rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] text-foreground selection:bg-primary/25">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] h-[50%] w-[50%] animate-pulse rounded-full bg-primary/20 blur-[130px]" />
        <div className="absolute bottom-[0%] right-[-20%] h-[60%] w-[60%] rounded-full bg-secondary/15 blur-[150px]" />
      </div>

      <div className="flex-1 flex flex-col p-0 relative z-10 overflow-y-auto">
        <div className="w-full">
          {/* Hero Section */}
          <div className="px-6 pt-16 pb-12 text-center relative">
            <div className="absolute right-6 top-6 rounded-full border border-white/80 bg-white/85 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-dark shadow-xl backdrop-blur-md">
              Level {persona.level}
            </div>
            
            <motion.div 
              initial={{ rotate: -20, scale: 0, y: 50 }}
              animate={{ rotate: 0, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="relative mx-auto mb-8 w-32 h-32"
            >
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] border border-white/80 bg-white/90 text-7xl shadow-[0_24px_60px_-28px_rgba(124,92,255,0.35)]">
                {persona.emoji}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h2 className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-dark">
                <span className="h-[1px] w-8 bg-primary/25"></span>
                Your Financial Persona
                <span className="h-[1px] w-8 bg-primary/25"></span>
              </h2>
              <h1 className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text pb-2 text-5xl font-black tracking-tight text-transparent">
                {persona.name}
              </h1>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 space-y-8 max-w-md mx-auto"
          >
            {/* The Roast */}
            <div className="relative rounded-3xl border border-white/80 bg-white/85 p-6 text-center italic text-foreground shadow-2xl backdrop-blur-xl">
              <span className="absolute -top-3 left-6 rounded-full border border-white/80 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-dark">
                The Roast
              </span>
              <p className="text-lg leading-relaxed font-medium">&quot;{persona.roast}&quot;</p>
            </div>

            {/* Estimated Budget */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <TrendingUp size={22} className="text-primary" />
                  Estimated Spending
                </h3>
              </div>
              
              <div className="space-y-5 rounded-3xl border border-white/80 bg-white/80 p-6 backdrop-blur-xl">
                {estimatedBudget.map((item, idx) => (
                  <div key={item.category} className="space-y-2.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="uppercase tracking-wider text-muted">{item.category}</span>
                      <span className="text-foreground">RM {item.amount}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/80 bg-surface-muted">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: 0.8 + idx * 0.1, duration: 1.2, ease: "easeOut" }}
                        className="relative h-full overflow-hidden rounded-full"
                        style={{ backgroundColor: item.color }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-xs leading-relaxed text-amber-900">
                  Based on Malaysian averages + your answers. Gets smarter as you log real transactions.
                </p>
              </div>
            </div>

            {/* Final CTA */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="pt-6 pb-12 space-y-6"
            >
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary via-secondary to-tertiary blur opacity-50 transition duration-500 group-hover:opacity-100"></div>
                <Button 
                  onClick={onEnter}
                  className="relative w-full overflow-hidden rounded-3xl py-8 text-xl font-bold text-white transition-all active:scale-[0.98]"
                >
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100" />
                  <span className="relative z-10 flex items-center justify-center">
                    <Rocket className="mr-3 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 text-white" size={24} />
                    Haiya! I Accept My Fate — Let's Go!
                  </span>
                </Button>
              </div>
              <div className="text-center">
                <span className="inline-flex animate-bounce items-center gap-1.5 rounded-full border border-primary/20 bg-primary-light px-5 py-2 text-sm font-bold text-primary-dark shadow-[0_0_15px_rgba(124,92,255,0.18)]">
                  <Sparkles size={16} />
                  +{xpEarned} XP earned!
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
