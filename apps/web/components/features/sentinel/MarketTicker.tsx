"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TICKER_ITEMS = [
  { symbol: "$EGGS", change: "+18.5%", trend: "up" },
  { symbol: "$RICE", change: "+8.2%", trend: "up" },
  { symbol: "$RON95", change: "-5.0%", trend: "down" },
  { symbol: "$CHICKEN", change: "+1.2%", trend: "up" },
  { symbol: "$CPO", change: "+12.0%", trend: "up" },
  { symbol: "$DIESEL", change: "-3.5%", trend: "down" },
  { symbol: "$FLOUR", change: "+14.0%", trend: "up" },
  { symbol: "$MILK", change: "+5.8%", trend: "up" },
];

export function MarketTicker() {
  return (
    <div className="w-full bg-zinc-900 overflow-hidden py-1.5 flex items-center border-b border-zinc-800">
      <div className="bg-red-600 text-[10px] font-black text-white px-2 py-0.5 rounded mr-3 ml-2 z-10 shadow-lg italic">LIVE</div>
      <motion.div
        className="flex whitespace-nowrap gap-8 items-center"
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
        }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] font-black text-zinc-300 tracking-tighter">{item.symbol}</span>
            <span className={cn(
              "text-[10px] font-black",
              item.trend === "up" ? "text-red-500" : "text-emerald-500"
            )}>
              {item.trend === "up" ? "▲" : "▼"} {item.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
