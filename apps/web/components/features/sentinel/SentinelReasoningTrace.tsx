"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Search, BarChart3, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SentinelReasoningTrace() {
  const steps = [
    {
      id: 1,
      title: "Analyze History",
      description: "Checking recent transactions for commodity-linked merchants (Mydin, Petronas, etc.)",
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: 2,
      title: "News Correlation",
      description: "Searching global & local news for price catalysts affecting your matched items.",
      icon: Search,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      id: 3,
      title: "Predict Impact",
      description: "Projecting monthly RM impact on your specific wallet based on volume.",
      icon: BarChart3,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm">
      <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Agent 5 Logic Chain</h2>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={step.id} className="relative">
            <div className="flex items-start gap-4">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", step.bg, step.color)}>
                <step.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900 leading-none mb-1">Step {step.id}: {step.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-zinc-50 flex items-center justify-center">
                 <ArrowDown className="w-3 h-3 text-zinc-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
