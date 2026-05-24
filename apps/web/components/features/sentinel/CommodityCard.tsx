"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Newspaper, ShoppingCart, Search, BarChart3, ChevronRight } from "lucide-react";
import { formatRM, cn } from "@/lib/utils";

export interface CommodityData {
  id: string;
  name: string;
  symbol: string;            // e.g. "$EGGS"
  emoji: string;
  category: string;
  currentPrice: string;
  trend: "up" | "down" | "flat";
  changePct: number;
  newsHeadline: string;
  newsSource: string;
  predictedImpactRm: number;
  lastUpdated: string;
  matchedTransactions?: string[]; // e.g. ["RM67.00 at Mydin"]
  sparkline?: number[];      // e.g. [1, 2, 1.5, 3, 2.8]
}

interface Props {
  commodity: CommodityData;
  index: number;
  onClick?: () => void;
}

const TREND_STYLES = {
  up:    { icon: TrendingUp,   color: "text-red-500", bg: "bg-red-50",     border: "border-red-100", chartColor: "#ef4444" },
  down:  { icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", chartColor: "#10b981" },
  flat:  { icon: Minus,        color: "text-zinc-400", bg: "bg-zinc-50",    border: "border-zinc-200", chartColor: "#a1a1aa" },
};

export function CommodityCard({ commodity, index, onClick }: Props) {
  const { icon: TrendIcon, color, bg, border, chartColor } = TREND_STYLES[commodity.trend];
  const isUp = commodity.trend === "up";

  // Simple SVG sparkline
  const sparklineData = commodity.sparkline || [10, 15, 8, 20, 18, 25, 22];
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;
  const points = sparklineData.map((d, i) => ({
    x: (i / (sparklineData.length - 1)) * 60,
    y: 20 - ((d - min) / range) * 15
  }));
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border bg-white p-4 transition-all hover:shadow-lg active:scale-[0.99] group",
        "border-zinc-100 shadow-sm"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm", bg)}>
            {commodity.emoji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-zinc-900 leading-none">{commodity.symbol || `$${commodity.id.toUpperCase()}`}</p>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter bg-zinc-100 px-1 rounded">{commodity.category}</span>
            </div>
            <p className="text-xs font-medium text-zinc-500">{commodity.name}</p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="flex-1 px-4 hidden sm:block">
          <svg width="60" height="20" className="overflow-visible">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              d={pathData}
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-zinc-900">{commodity.currentPrice.split("–")[0].split("/")[0]}</p>
          <div className={cn("flex items-center justify-end gap-0.5 text-[11px] font-black", color)}>
            <TrendIcon className="w-3 h-3" />
            <span>{isUp ? "+" : ""}{commodity.changePct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold border-t border-zinc-50 pt-3">
        <div className="flex items-center gap-1 text-zinc-400">
          <ShoppingCart className="w-3 h-3" />
          <span>MATCHED: <span className="text-zinc-600">{commodity.matchedTransactions?.[0] || "None recent"}</span></span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <Search className="w-3 h-3" />
          <span>NEWS CORRELATION: <span className={cn(isUp ? "text-red-500" : "text-emerald-500")}>{isUp ? "HIGH" : "LOW"}</span></span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 group-hover:bg-zinc-100 transition-colors">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prediction</span>
        </div>
        <div className="flex items-center gap-2">
           <span className={cn("text-xs font-black", isUp ? "text-red-600" : "text-emerald-600")}>
            {isUp ? "+" : "-"}{formatRM(commodity.predictedImpactRm)} <span className="text-[10px] font-medium text-zinc-400">/ mo</span>
          </span>
          <ChevronRight className="w-3 h-3 text-zinc-300" />
        </div>
      </div>
    </motion.button>
  );
}
