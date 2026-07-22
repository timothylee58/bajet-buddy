"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { formatRM, formatSignedRM, cn } from "@/lib/utils";
import { CATEGORIES, VERDICT_CONFIG, BAYARLAH_URL } from "@/lib/constants";
import { getTransactions } from "@/lib/api";
import { RefreshCw, AlertCircle, ArrowLeft, Filter, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Transaction } from "@/types";
import { AddTransactionModal } from "@/components/features/transactions/AddTransactionModal";
import { useToast } from "@/components/ui/ToastProvider";

// ─── Inner component that uses useSearchParams ────────────────────────────────

function TransactionsList() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(
    categoryFilter
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const { success } = useToast();

  async function handleSplitWithBayarlah(tx: Transaction) {
    const summary = `${formatRM(Math.abs(tx.amount))} — ${tx.merchant}`;
    try {
      await navigator.clipboard.writeText(summary);
      success(`Copied "${summary}" — paste it when you create the bill in Bayar.lah`);
    } catch {
      // clipboard permission denied — still open Bayar.lah, just skip the toast
    }
    window.open(BAYARLAH_URL, "_blank", "noopener,noreferrer");
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(Array.isArray(data) ? (data as Transaction[]) : []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError(
        "Could not load transactions. Make sure the API server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Sync filter from URL param on mount
  useEffect(() => {
    setActiveFilter(categoryFilter);
  }, [categoryFilter]);

  const filtered = activeFilter
    ? transactions.filter((t) => t.category === activeFilter)
    : transactions;

  const activeCat = CATEGORIES.find((c) => c.id === activeFilter);

  return (
    <div className="flex flex-col min-h-full px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition-colors active-press"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-headline text-2xl font-bold text-foreground">
              {activeFilter
                ? `${activeCat?.emoji ?? "📦"} ${activeCat?.name ?? activeFilter}`
                : "All Transactions"}
            </h1>
            <p className="font-sans text-xs text-muted">
              {activeFilter
                ? "Filtered by category"
                : "Your full spending history"}
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="p-2 rounded-full hover:bg-surface-muted transition-colors active-press"
          aria-label="Refresh transactions"
        >
          <RefreshCw
            className={cn("w-4 h-4 text-muted", loading && "animate-spin")}
          />
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar mb-4">
        <button
          onClick={() => setActiveFilter(null)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full font-sans text-xs font-bold transition-all active-press",
            activeFilter === null
              ? "bg-primary text-white chunky-shadow"
              : "bg-surface-muted text-muted"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setActiveFilter(activeFilter === cat.id ? null : cat.id)
            }
            className={cn(
              "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full font-sans text-xs font-bold transition-all active-press",
              activeFilter === cat.id
                ? "bg-primary text-white chunky-shadow"
                : "bg-surface-muted text-muted"
            )}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border-b-4 border-border/30 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-muted rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-surface-muted rounded" />
                  <div className="h-3 w-24 bg-surface-muted/60 rounded" />
                </div>
                <div className="h-5 w-16 bg-surface-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <p className="text-5xl mb-3">📭</p>
          <p className="font-headline text-lg text-foreground">
            No transactions {activeFilter ? "in this category" : "yet"}
          </p>
          <p className="font-sans text-sm text-muted mt-1">
            {activeFilter
              ? "Try removing the filter or add a transaction."
              : "Your spending history will appear here."}
          </p>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-full font-sans text-sm font-bold active-press"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {/* Summary pill when filtered */}
          {activeFilter && (
            <div className="flex items-center justify-between bg-primary-light/40 px-4 py-2 rounded-xl mb-1">
              <div className="flex items-center gap-1 font-sans text-xs text-primary-dark font-bold">
                <Filter className="w-3 h-3" />
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
              </div>
              <span className="font-headline text-sm font-bold text-primary">
                Total: {formatSignedRM(filtered.reduce((a, t) => a + t.amount, 0))}
              </span>
            </div>
          )}

          {filtered.map((tx, idx) => {
            const cat = CATEGORIES.find((c) => c.id === tx.category);
            const verdictCfg =
              VERDICT_CONFIG[tx.verdict] ?? VERDICT_CONFIG.fikir_dulu;

            return (
              <motion.div
                key={tx.id ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-2xl bg-white border-b-4 border-border/30 p-4 chunky-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {cat?.emoji ?? "📦"}
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-foreground">
                        {tx.merchant}
                      </p>
                      <p className="font-sans text-xs text-muted">
                        {cat?.name ?? tx.category} ·{" "}
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString(
                              "en-MY",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              }
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        "font-headline font-bold",
                        tx.amount < 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {formatSignedRM(tx.amount)}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        verdictCfg.bg,
                        verdictCfg.color
                      )}
                    >
                      {verdictCfg.emoji}{" "}
                      {tx.verdict === "boleh"
                        ? "Boleh"
                        : tx.verdict === "fikir_dulu"
                          ? "Fikir"
                          : "Jangan"}
                    </span>
                  </div>
                </div>
                {tx.note && (
                  <p className="font-sans text-xs text-muted mt-2 pl-15 italic">
                    {tx.note}
                  </p>
                )}
                {BAYARLAH_URL && (
                  <button
                    onClick={() => void handleSplitWithBayarlah(tx)}
                    data-testid="split-with-bayarlah-button"
                    className="mt-3 flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 font-sans text-xs font-semibold text-foreground hover:bg-border/30 transition-colors active-press"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Split with Bayar.lah
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating add button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-white"
      >
        <Plus size={28} />
      </motion.button>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={load}
      />
    </div>
  );
}

// ─── Page wrapper with Suspense boundary (required for useSearchParams) ───────

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full px-4 py-6 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 bg-surface-muted rounded animate-pulse" />
            <div className="h-6 w-40 bg-surface-muted rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border-b-4 border-border/30 p-4 animate-pulse h-20"
              />
            ))}
          </div>
        </div>
      }
    >
      <TransactionsList />
    </Suspense>
  );
}
