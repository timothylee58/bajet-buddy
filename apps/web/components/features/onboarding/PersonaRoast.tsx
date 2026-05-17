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
    <div className="flex flex-col min-h-[100dvh] bg-zinc-950 text-white selection:bg-brand/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand/20 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[0%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      <div className="flex-1 flex flex-col p-0 relative z-10 overflow-y-auto">
        <div className="w-full">
          {/* Hero Section */}
          <div className="px-6 pt-16 pb-12 text-center relative">
            <div className="absolute top-6 right-6 bg-zinc-900/80 border border-zinc-800 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-300 shadow-xl backdrop-blur-md">
              Level {persona.level}
            </div>
            
            <motion.div 
              initial={{ rotate: -20, scale: 0, y: 50 }}
              animate={{ rotate: 0, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="relative mx-auto mb-8 w-32 h-32"
            >
              <div className="absolute inset-0 bg-brand/30 blur-2xl rounded-full animate-pulse" />
              <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] bg-gradient-to-br from-zinc-800 to-zinc-900 text-7xl shadow-[0_0_50px_-10px_rgba(34,197,94,0.4)] border border-zinc-700/50">
                {persona.emoji}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-light flex items-center justify-center gap-2">
                <span className="w-8 h-[1px] bg-brand-light/30"></span>
                Your Financial Persona
                <span className="w-8 h-[1px] bg-brand-light/30"></span>
              </h2>
              <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 pb-2">
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
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 relative italic text-zinc-300 text-center shadow-2xl backdrop-blur-xl">
              <span className="absolute -top-3 left-6 bg-zinc-950 px-4 py-1 text-[10px] font-bold text-brand uppercase tracking-widest rounded-full border border-zinc-800">
                The Roast
              </span>
              <p className="text-lg leading-relaxed font-medium">&quot;{persona.roast}&quot;</p>
            </div>

            {/* Estimated Budget */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                  <TrendingUp size={22} className="text-brand" />
                  Estimated Spending
                </h3>
              </div>
              
              <div className="space-y-5 p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-xl">
                {estimatedBudget.map((item, idx) => (
                  <div key={item.category} className="space-y-2.5">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-zinc-400 uppercase tracking-wider">{item.category}</span>
                      <span className="text-white">RM {item.amount}</span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: 0.8 + idx * 0.1, duration: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ backgroundColor: item.color }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 shadow-lg">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-amber-200/80 leading-relaxed">
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
                <div className="absolute -inset-[1px] bg-gradient-to-r from-brand via-emerald-400 to-blue-500 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-gradient-xy"></div>
                <Button 
                  onClick={onEnter}
                  className="relative w-full py-8 text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-3xl transition-all active:scale-[0.98] text-white shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="relative z-10 flex items-center justify-center">
                    <Rocket className="mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-brand" size={24} />
                    I Accept My Fate — Let&apos;s Go!
                  </span>
                </Button>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 text-brand font-bold animate-bounce bg-brand/10 border border-brand/20 px-5 py-2 rounded-full text-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]">
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
