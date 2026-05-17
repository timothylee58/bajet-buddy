"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatRM, cn } from "@/lib/utils";
import { CATEGORIES, VERDICT_CONFIG } from "@/lib/constants";
import { getTransactions } from "@/lib/api";
import { RefreshCw, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Could not load transactions. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col h-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/check" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Recent Transactions</h1>
            <p className="text-xs text-zinc-400">Your spending history</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4 text-zinc-400", loading && "animate-spin")} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 animate-pulse">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && transactions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">No transactions yet</p>
          <p className="text-sm text-zinc-500 mt-1">Your spending history will appear here.</p>
        </div>
      )}

      {/* List */}
      {!loading && transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx, idx) => {
            const cat = CATEGORIES.find((c) => c.id === tx.category);
            const verdictCfg = VERDICT_CONFIG[tx.verdict] ?? VERDICT_CONFIG.fikir_dulu;

            return (
              <motion.div
                key={tx.id ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{cat?.emoji ?? "📦"}</span>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {tx.merchant}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {cat?.name ?? tx.category} · {tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{formatRM(tx.amount)}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", verdictCfg.bg, verdictCfg.color)}>
                      {verdictCfg.emoji} {tx.verdict === "boleh" ? "Boleh" : tx.verdict === "fikir_dulu" ? "Fikir" : "Jangan"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
