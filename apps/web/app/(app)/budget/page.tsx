"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";
import { formatRM, cn } from "@/lib/utils";
import { DataError } from "@/components/ui/DataError";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍜",
  transport: "🚗",
  shopping: "🛍️",
  entertainment: "🎮",
  health: "💊",
  utilities: "💡",
  education: "📚",
  other: "📦",
};

interface CategoryBudget {
  category_id: string;
  allocated: number;
  spent: number;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data, error: dbError } = await sb
        .from("category_budgets")
        .select("category_id, allocated, spent")
        .eq("user_id", user.id);

      if (dbError) throw new Error(dbError.message);

      const merged: CategoryBudget[] = CATEGORIES.map((cat) => {
        const found = (data ?? []).find((r: CategoryBudget) => r.category_id === cat.id);
        return found ?? { category_id: cat.id, allocated: 0, spent: 0 };
      });
      setBudgets(merged);
      const vals: Record<string, string> = {};
      merged.forEach((b) => { vals[b.category_id] = String(b.allocated || ""); });
      setInputValues(vals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load budget data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveBudget(catId: string) {
    if (!userId) return;
    const allocated = parseFloat(inputValues[catId] ?? "0") || 0;
    setSaving(catId);
    const sb = createClient();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthStr = thisMonth.toISOString().slice(0, 10);

    // Upsert into category_budgets
    await sb.from("category_budgets").upsert(
      { user_id: userId, category_id: catId, allocated, month: monthStr },
      { onConflict: "user_id,category_id,month" }
    );

    setBudgets((prev) =>
      prev.map((b) => (b.category_id === catId ? { ...b, allocated } : b))
    );
    setSaving(null);
    setEditing(null);
  }

  const totalAllocated = budgets.reduce((a, b) => a + b.allocated, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted hover:text-foreground active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Budget Settings</h1>
          <p className="font-sans text-xs text-muted">Set your spending limit per category</p>
        </div>
      </div>

      {/* Summary card */}
      {!loading && totalAllocated > 0 && (
        <div className="bg-gradient-to-br from-primary-light to-primary p-5 rounded-2xl border-b-4 border-primary chunky-shadow mb-5 text-white">
          <p className="font-sans text-xs uppercase tracking-wider text-white/70 mb-1">Monthly Budget</p>
          <p className="font-headline text-3xl font-bold">{formatRM(totalAllocated)}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <p className="font-sans text-[10px] text-white/60 uppercase">Spent</p>
              <p className="font-headline font-bold">{formatRM(totalSpent)}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-white/60 uppercase">Remaining</p>
              <p className="font-headline font-bold">{formatRM(Math.max(0, totalAllocated - totalSpent))}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] text-white/60 uppercase">Used</p>
              <p className="font-headline font-bold">
                {totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <DataError message={error} onRetry={() => void load()} className="mb-4" />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const cat = CATEGORIES.find((c) => c.id === budget.category_id);
            const pct = budget.allocated > 0 ? Math.min(100, (budget.spent / budget.allocated) * 100) : 0;
            const over = budget.spent > budget.allocated && budget.allocated > 0;
            const isEditing = editing === budget.category_id;
            const isSaving = saving === budget.category_id;

            return (
              <div
                key={budget.category_id}
                className="bg-white rounded-2xl border-b-4 border-border/30 p-4 chunky-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-muted rounded-xl flex items-center justify-center text-xl">
                      {CATEGORY_ICONS[budget.category_id] ?? "📦"}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-bold text-foreground">
                        {cat?.name ?? budget.category_id}
                      </p>
                      <p className="font-sans text-xs text-muted">
                        {formatRM(budget.spent)} spent
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-bold text-muted">RM</span>
                      <input
                        type="number"
                        value={inputValues[budget.category_id] ?? ""}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            [budget.category_id]: e.target.value,
                          }))
                        }
                        className="w-24 font-headline text-lg font-bold text-foreground border-b-2 border-primary outline-none bg-transparent text-right"
                        placeholder="0"
                        autoFocus
                        min={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveBudget(budget.category_id);
                          if (e.key === "Escape") setEditing(null);
                        }}
                      />
                      <button
                        onClick={() => void saveBudget(budget.category_id)}
                        disabled={isSaving}
                        className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center active-press"
                      >
                        {isSaving ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn("font-headline text-lg font-bold", over ? "text-red-600" : "text-foreground")}>
                        {budget.allocated > 0 ? formatRM(budget.allocated) : "—"}
                      </span>
                      <button
                        onClick={() => setEditing(budget.category_id)}
                        className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center active-press hover:bg-primary-light"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {budget.allocated > 0 && (
                  <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mt-1">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        over ? "bg-red-500" : pct > 80 ? "bg-tertiary" : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
                {over && (
                  <p className="font-sans text-[10px] text-red-500 font-bold mt-1">
                    Over budget by {formatRM(budget.spent - budget.allocated)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save all hint */}
      {editing && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto">
          <div className="bg-primary text-white rounded-2xl p-3 text-center font-sans text-sm font-bold chunky-shadow">
            Tap ✓ or press Enter to save · Esc to cancel
          </div>
        </div>
      )}
    </div>
  );
}
