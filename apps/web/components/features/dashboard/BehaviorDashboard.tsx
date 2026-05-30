"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Zap,
  Utensils,
  ShoppingBag,
  Car,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";
import { useDashboardPulse } from "@/hooks/useDashboardPulse";
import { useRecentTransactions } from "@/hooks/useRecentTransactions";
import { createClient } from "@/lib/supabase/client";
import { formatRM, formatSignedRM } from "@/lib/utils";
import { CATEGORIES, VERDICT_CONFIG } from "@/lib/constants";
import { DataError } from "@/components/ui/DataError";

function useUserName() {
  const [name, setName] = useState<string>("there");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) return;
      const full =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "there";
      // Only show first name
      setName((full as string).split(" ")[0]);
    });
  }, []);

  return name;
}

// Category quick stats shown on dashboard — links to /transactions?category=X
const CATEGORY_CARDS = [
  {
    id: "food",
    label: "Food",
    icon: Utensils,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    barColor: "bg-orange-400",
    budget: 500,
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    iconBg: "bg-primary-light",
    iconColor: "text-primary-dark",
    barColor: "bg-primary",
    budget: 400,
  },
  {
    id: "transport",
    label: "Transport",
    icon: Car,
    iconBg: "bg-secondary-light",
    iconColor: "text-secondary-dark",
    barColor: "bg-secondary",
    budget: 200,
  },
] as const;

export function BehaviorDashboard() {
  const [purchaseTriggered, setPurchaseTriggered] = useState(true);
  const pulse = useDashboardPulse();
  const name = useUserName();
  const { budget, gamification, loading: pulseLoading, errors: pulseErrors } = useDashboardPulse();
  const { transactions: recentTx, loading: txLoading, error: txError } =
    useRecentTransactions(3);

  const spentPct = budget
    ? Math.min(
        100,
        Math.round((budget.total_spent / budget.total_income) * 100)
      )
    : 75;

  const isLoading = pulseLoading;

  const monthName = new Date().toLocaleString("en-MY", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:px-6 lg:max-w-2xl">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary">
            Hi {name} 👋
          </h1>
          <p className="font-sans text-xs text-muted mt-0.5">{monthName} · Day {new Date().getDate()} of {budget?.total_days ?? 30}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Streak badge — links to /streak */}
          <Link
            href="/streak"
            className="bg-tertiary text-white px-3 py-1 rounded-full flex items-center gap-1 font-sans text-sm font-bold chunky-shadow active-press"
          >
            <Zap className="w-4 h-4 fill-current" />
            {isLoading ? "..." : `${gamification?.streak ?? 0} days`}
          </Link>
          {/* Profile avatar — links to /profiles */}
          <Link href="/profiles">
            <div className="w-10 h-10 rounded-xl bg-primary-light border-2 border-primary overflow-hidden flex items-center justify-center active-press">
              <span className="text-xl">🐿️</span>
            </div>
          </Link>
        </div>
      </div>

      {/* API error banner — shown when budget/freeze/gamification fetches fail */}
      {pulseErrors.length > 0 && (
        <DataError
          message={pulseErrors[0]}
          compact
          className="mb-4"
        />
      )}

      {/* Financial Heartbeat Card — clicking balance links to /transactions */}
      <Link href="/transactions" className="block mb-6">
        <section className="relative bg-gradient-to-br from-primary-light to-primary p-6 rounded-[24px] text-primary-dark border-b-4 border-primary chunky-shadow overflow-hidden active-press">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <span className="font-sans text-sm font-bold opacity-90 uppercase tracking-wider text-primary-dark/80">
                Kaching! Heartbeat
              </span>
              <h2 className="font-headline text-5xl font-bold mt-1 leading-tight text-white drop-shadow-md">
                {isLoading ? (
                  <span className="opacity-50">...</span>
                ) : (
                  formatRM(budget.remaining)
                )}
              </h2>
            </div>
            <div className="bg-tertiary-light text-tertiary-dark px-3 py-1 rounded-full flex items-center gap-2 font-sans text-sm font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary pulse-dot" />
              Watch your bajet
            </div>
          </div>
          <p className="relative z-10 font-sans text-base mb-6 text-white/90">
            {isLoading
              ? "Loading..."
              : `left for ${budget.days_left} days · ${formatRM(budget.daily_safe_amount)}/day`}
          </p>

          <div className="relative z-10 space-y-2">
            <div className="flex justify-between font-sans text-sm font-bold text-white">
              <span>{isLoading ? "—" : `${budget.days_left} days to gaji`}</span>
              <span>{isLoading ? "—" : `${spentPct}% used`}</span>
            </div>
            <div className="h-4 w-full bg-black/20 rounded-full relative overflow-hidden liquid-progress">
              <div
                className="h-full bg-secondary-dark rounded-full transition-all duration-700"
                style={{ width: `${spentPct}%` }}
              />
            </div>
          </div>

          {/* Subtle hint */}
          <div className="relative z-10 flex items-center justify-end gap-1 mt-3 text-white/60 text-xs font-sans">
            <Receipt className="w-3 h-3" />
            <span>Tap to see transactions</span>
          </div>
        </section>
      </Link>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        {/* Spent → transactions */}
        <Link href="/transactions" className="block">
          <div className="bg-surface-muted p-4 rounded-2xl border-b-4 border-border/30 flex flex-col items-center shadow-sm active-press h-full">
            <span className="font-sans text-xs font-bold text-muted uppercase">
              Spent
            </span>
            <span className="font-headline text-2xl font-semibold text-primary mt-1">
              {isLoading ? "..." : formatRM(budget.total_spent)}
            </span>
          </div>
        </Link>

        {/* BNPL due → freeze page */}
        <Link href="/freeze" className="block">
          <div className="bg-surface-muted p-4 rounded-2xl border-b-4 border-border/30 flex flex-col items-center shadow-sm active-press h-full">
            <span className="font-sans text-xs font-bold text-muted uppercase">
              Balance
            </span>
            <span className="font-headline text-2xl font-semibold text-red-600 mt-1">
              {isLoading ? "..." : formatRM(budget.remaining)}
            </span>
          </div>
        </Link>

        {/* Income stat → income page */}
        <Link href="/income" className="block">
          <div className="bg-secondary-light p-4 rounded-2xl border-b-4 border-secondary/40 flex flex-col items-center shadow-sm active-press h-full">
            <span className="font-sans text-xs font-bold text-secondary-dark uppercase">
              Income
            </span>
            <span className="font-headline text-2xl font-semibold text-secondary-dark mt-1">
              {isLoading ? "..." : formatRM(budget.total_income)}
            </span>
          </div>
        </Link>
      </section>

      {/* Mascot Companion Card — links to profiles */}
      <Link href="/profiles" className="block mb-8">
        <section className="bg-white p-5 rounded-2xl border-2 border-primary-light flex gap-4 items-center chunky-shadow active-press">
          <div className="w-24 h-24 flex-shrink-0 bg-primary-light rounded-2xl border-b-4 border-primary/20 flex items-center justify-center relative">
            <span className="text-5xl">🐿️</span>
            <div className="absolute -bottom-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              LV.{gamification?.level ?? "?"}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-headline text-2xl text-foreground">
                Young Bajet
              </h3>
              <p className="font-sans text-sm font-bold text-primary italic">
                {gamification?.level_name ?? "Bajet Baru"} · {gamification?.xp ?? 0} XP
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-sans font-bold text-muted uppercase">
                <span>{gamification?.streak ?? 0}-day streak</span>
                <span>
                  {gamification
                    ? `${gamification.xp_to_next - gamification.xp} XP to next`
                    : "—"}
                </span>
              </div>
              <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${gamification?.progress_pct ?? 0}%` }}
                />
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
        </section>
      </Link>

      {/* Latest Badge — links to badges page */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline text-2xl">Latest Collection</h3>
          <Link
            href="/badges"
            className="text-primary font-sans text-sm font-bold active-press flex items-center gap-1"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <Link href="/badges" className="block">
          <div className="bg-white p-4 rounded-2xl border-2 border-border/30 flex items-center gap-4 relative overflow-hidden group active-press cursor-pointer chunky-shadow">
            <div className="w-14 h-14 bg-gradient-to-tr from-yellow-100 to-yellow-300 rounded-full flex items-center justify-center text-2xl border-2 border-yellow-400 flex-shrink-0">
              🌙
            </div>
            <div className="flex-1">
              <h4 className="font-headline text-2xl flex items-center gap-2">
                Tidur Awal
                <Sparkles className="text-yellow-500 animate-bounce w-5 h-5 fill-current" />
              </h4>
              <p className="font-sans text-base text-muted">
                Slept before 11PM for 3 days! Steady.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted flex-shrink-0" />
          </div>
        </Link>
      </section>

      {/* Budget by Category */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline text-2xl">Bajet by Category</h3>
          <div className="flex items-center gap-3">
            <Link
              href="/budget"
              className="text-muted font-sans text-sm font-bold active-press flex items-center gap-1"
            >
              Set budgets
            </Link>
            <Link
              href="/transactions"
              className="text-primary font-sans text-sm font-bold active-press flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {CATEGORY_CARDS.map(
            ({ id, label, icon: Icon, iconBg, iconColor, barColor, budget: cat_budget }) => {
              // Sum spent from recent transactions for this category
              const spent = recentTx
                .filter((t) => t.category === id)
                .reduce((acc, t) => acc + t.amount, 0);
              const pct = Math.min(100, Math.round((spent / cat_budget) * 100));

              return (
                <Link
                  key={id}
                  href={`/transactions?category=${id}`}
                  className="min-w-[160px] bg-white p-4 rounded-2xl border-b-4 border-border/30 chunky-shadow flex-shrink-0 active-press block"
                >
                  <div
                    className={`w-10 h-10 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-sans text-sm font-bold mb-1">{label}</h4>
                  <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${barColor}`}
                      style={{
                        width: txLoading ? "0%" : `${pct || 10}%`,
                        transition: "width 0.7s ease",
                      }}
                    />
                  </div>
                  <p className="text-[12px] font-sans font-bold">
                    <span className="text-foreground">
                      {txLoading ? "..." : formatRM(spent || 0)}
                    </span>
                    <span className="text-muted">/{formatRM(cat_budget)}</span>
                  </p>
                </Link>
              );
            }
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="pb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline text-2xl">Recent Perbelanjaan</h3>
          <Link
            href="/transactions"
            className="text-primary font-sans text-sm font-bold active-press flex items-center gap-1"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {txLoading ? (
            // Skeleton
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-border/30 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-surface-muted rounded" />
                    <div className="h-2 w-20 bg-surface-muted/60 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-surface-muted rounded" />
              </div>
            ))
          ) : txError ? (
            <DataError
              message="Could not load recent transactions"
              compact
            />
          ) : recentTx.length === 0 ? (
            // Empty state — prompt to add first transaction
            <Link href="/check" className="block">
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-border/30 text-center active-press">
                <span className="text-4xl mb-3">📭</span>
                <p className="font-headline text-lg text-foreground">
                  No transactions yet
                </p>
                <p className="font-sans text-sm text-muted mt-1">
                  Tap to check your first spend 🎉
                </p>
              </div>
            </Link>
          ) : (
            recentTx.map((tx) => {
              const cat = CATEGORIES.find((c) => c.id === tx.category);
              const verdictCfg =
                VERDICT_CONFIG[tx.verdict] ?? VERDICT_CONFIG.fikir_dulu;

              return (
                <Link
                  key={tx.id}
                  href="/transactions"
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-border/30 active-press transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center text-2xl">
                      {cat?.emoji ?? "📦"}
                    </div>
                    <div>
                      <p className="font-sans text-base font-semibold">
                        {tx.merchant}
                      </p>
                      <p className="font-sans text-[14px] text-muted">
                        {cat?.name ?? tx.category} ·{" "}
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString(
                              "en-MY",
                              { day: "numeric", month: "short" }
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`font-headline text-lg font-bold ${
                        tx.amount < 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {formatSignedRM(tx.amount)}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${verdictCfg.bg} ${verdictCfg.color}`}
                    >
                      {verdictCfg.emoji}{" "}
                      {tx.verdict === "boleh"
                        ? "Boleh"
                        : tx.verdict === "fikir_dulu"
                          ? "Fikir"
                          : "Jangan"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Quick-action row at the bottom */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link
            href="/check"
            className="flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-sans font-bold text-sm chunky-shadow active-press"
          >
            <TrendingUp className="w-5 h-5" />
            Check Spend
          </Link>
          <Link
            href="/receipts"
            className="flex items-center justify-center gap-2 p-4 bg-secondary-light text-secondary-dark rounded-2xl font-sans font-bold text-sm border-b-4 border-secondary/40 active-press"
          >
            <Wallet className="w-5 h-5" />
            Scan Receipt
          </Link>
        </div>
      </section>
    </div>
  );
}
