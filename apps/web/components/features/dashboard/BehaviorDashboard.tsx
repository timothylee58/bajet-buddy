"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  CreditCard,
  Flame,
  Landmark,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clamp, cn } from "@/lib/utils";
import { useDashboardPulse } from "@/hooks/useDashboardPulse";

type Locale = "en" | "bm";
type RiskStatus = "low" | "medium" | "high";

const dashboardCopy = {
  en: {
    product: "Bajet Buddy",
    headline: "Stop the bad spending decision before checkout.",
    subheadline:
      "A behavioural finance dashboard for young Malaysians living paycheque to paycheque.",
    cycle: "Day 18 of salary cycle",
    location: "Petaling Jaya",
    profile: "Sarah, 26 · Fresh grad",
    language: "Language",
    home: "Home Dashboard",
    heartbeat: "Financial Heartbeat",
    budget: "Budget Summary",
    transactions: "Recent Transactions",
    bnpl: "BNPL Commitments",
    timeline: "Spending Timeline",
    categories: "Category Progress",
    currentBalance: "Current balance estimate",
    daysUntilSalary: "Days until salary",
    dailySurvival: "Daily survival amount",
    monthlySpend: "Total monthly spending",
    budgetUsage: "Budget usage",
    bnplDue: "BNPL due this month",
    riskStatus: "Risk status",
    nudgeTitle: "Bajet Buddy Intervention",
    nudgeBody:
      "Sarah is about to buy a RM189 dress on Shopee. The engine checks her cycle position, BNPL load, and remaining runway before she taps pay.",
    nudgeCta: "Simulate Shopee purchase",
    resetCta: "Back to current state",
    dontBuy: "Jangan dulu",
    interventionReason:
      "If Sarah buys this now, she drops below a safe daily runway for the next 7 days.",
    safeReason:
      "Current spending is still manageable, but discretionary shopping is tightening her runway.",
    projectedBalance: "Projected balance after purchase",
    projectedDaily: "Projected daily runway",
    heartbeatBody:
      "Runway, salary timing, and fixed commitments move together. This section shows whether the rest of the month is still survivable.",
    budgetBody:
      "The monthly budget is not just a cap. It is the amount Sarah can spend without creating stress before payday.",
    transactionsBody:
      "Recent behaviour matters more than category labels. These are the purchases shaping Sarah's current risk.",
    bnplBody:
      "BNPL is treated as future cash already spoken for, not optional debt hidden outside the budget.",
    timelineBody:
      "Spending spikes appear around weekends, online campaigns, and convenience-led purchases.",
    categoryBody:
      "Overspending is concentrated in shopping, not essentials. That is where intervention should start.",
    view: "View",
    due: "Due",
    paid: "Paid",
    used: "used",
    safeToSpend: "Safe to spend today",
    afterBills: "After bills and BNPL",
    nextSalary: "Next salary",
    salaryDate: "23 May 2026",
    monthlyBudget: "Monthly budget",
    plannedPurchase: "Planned purchase",
    merchant: "Shopee Malaysia",
    dress: "Dress",
    fixedCommitments: "Fixed commitments",
    note: "BM/EN toggle-ready and running on mock data for the no-login demo.",
    focusNote: "Bajet Buddy focuses on prevention, not passive tracking.",
  },
  bm: {
    product: "Bajet Buddy",
    headline: "Hentikan keputusan belanja buruk sebelum checkout.",
    subheadline:
      "Papan pemuka kewangan tingkah laku untuk rakyat muda Malaysia yang hidup ikut gaji ke gaji.",
    cycle: "Hari ke-18 kitaran gaji",
    location: "Petaling Jaya",
    profile: "Sarah, 26 · Graduan baharu",
    language: "Bahasa",
    home: "Dashboard Utama",
    heartbeat: "Nadi Kewangan",
    budget: "Ringkasan Bajet",
    transactions: "Transaksi Terkini",
    bnpl: "Komitmen BNPL",
    timeline: "Garis Masa Perbelanjaan",
    categories: "Kemajuan Kategori",
    currentBalance: "Anggaran baki semasa",
    daysUntilSalary: "Hari hingga gaji",
    dailySurvival: "Jumlah selamat setiap hari",
    monthlySpend: "Jumlah belanja bulanan",
    budgetUsage: "Penggunaan bajet",
    bnplDue: "BNPL bulan ini",
    riskStatus: "Status risiko",
    nudgeTitle: "Intervensi Bajet Buddy",
    nudgeBody:
      "Sarah hampir membeli gaun RM189 di Shopee. Enjin ini semak kedudukan kitaran gaji, beban BNPL, dan baki runway sebelum dia tekan bayar.",
    nudgeCta: "Simulasi pembelian Shopee",
    resetCta: "Kembali ke keadaan semasa",
    dontBuy: "Jangan dulu",
    interventionReason:
      "Jika Sarah beli sekarang, baki harian selamatnya jatuh terlalu rendah untuk 7 hari seterusnya.",
    safeReason:
      "Belanja semasa masih terkawal, tetapi pembelian bukan keperluan sedang mengetatkan runway.",
    projectedBalance: "Unjuran baki selepas beli",
    projectedDaily: "Unjuran runway harian",
    heartbeatBody:
      "Runway, tarikh gaji, dan komitmen tetap bergerak bersama. Bahagian ini tunjuk sama ada baki bulan ini masih selamat.",
    budgetBody:
      "Bajet bulanan bukan sekadar had. Ia ialah jumlah yang Sarah boleh belanja tanpa tambah tekanan sebelum gaji masuk.",
    transactionsBody:
      "Tingkah laku terkini lebih penting daripada label kategori. Inilah transaksi yang membentuk risiko Sarah sekarang.",
    bnplBody:
      "BNPL dikira sebagai tunai masa depan yang sudah digunakan, bukan hutang pilihan yang disorok di luar bajet.",
    timelineBody:
      "Lonjakan belanja muncul sekitar hujung minggu, kempen atas talian, dan pembelian kerana mudah.",
    categoryBody:
      "Lebihan belanja tertumpu pada shopping, bukan keperluan asas. Intervensi patut bermula di sini.",
    view: "Lihat",
    due: "Perlu bayar",
    paid: "Dibayar",
    used: "digunakan",
    safeToSpend: "Selamat dibelanja hari ini",
    afterBills: "Selepas bil dan BNPL",
    nextSalary: "Gaji seterusnya",
    salaryDate: "23 Mei 2026",
    monthlyBudget: "Bajet bulanan",
    plannedPurchase: "Pembelian dirancang",
    merchant: "Shopee Malaysia",
    dress: "Gaun",
    fixedCommitments: "Komitmen tetap",
    note: "Togol BM/EN sedia digunakan dan berjalan atas data demo tanpa log masuk.",
    focusNote: "Bajet Buddy fokus pada pencegahan, bukan penjejakan pasif.",
  },
} as const;

const sarahDemo = {
  salary: 3200,
  currentBalance: 340,
  monthlySpending: 2100,
  monthlyBudget: 2750,
  daysUntilSalary: 7,
  cycleDay: 18,
  cycleLength: 25,
  bnplDueThisMonth: 214,
  fixedCommitments: 546,
  plannedPurchaseAmount: 189,
  currentRisk: "medium" as RiskStatus,
  projectedRisk: "high" as RiskStatus,
  heartbeat: [
    { label: "Day 12", balance: 1180 },
    { label: "Day 14", balance: 980 },
    { label: "Day 16", balance: 740 },
    { label: "Day 18", balance: 340 },
    { label: "If buy", balance: 151 },
    { label: "Payday", balance: 3200 },
  ],
  spendingTimeline: [
    { day: "Mon", amount: 52 },
    { day: "Tue", amount: 38 },
    { day: "Wed", amount: 120 },
    { day: "Thu", amount: 64 },
    { day: "Fri", amount: 180 },
    { day: "Sat", amount: 236 },
    { day: "Sun", amount: 91 },
  ],
  categoryProgress: [
    { name: "Shopping", spent: 780, budget: 520, color: "#f97316" },
    { name: "Food", spent: 420, budget: 500, color: "#14b8a6" },
    { name: "Transport", spent: 260, budget: 320, color: "#38bdf8" },
    { name: "Bills", spent: 390, budget: 430, color: "#a78bfa" },
    { name: "Social", spent: 250, budget: 220, color: "#f43f5e" },
  ],
  recentTransactions: [
    {
      merchant: "Shopee top-up",
      category: "Shopping",
      date: "16 May",
      amount: -74.9,
      tag: "Impulse",
    },
    {
      merchant: "LRT Kelana Jaya",
      category: "Transport",
      date: "16 May",
      amount: -6.4,
      tag: "Essential",
    },
    {
      merchant: "FamilyMart SS2",
      category: "Food",
      date: "15 May",
      amount: -18.5,
      tag: "Convenience",
    },
    {
      merchant: "Salary credit",
      category: "Income",
      date: "30 Apr",
      amount: 3200,
      tag: "Income",
    },
  ],
  bnplCommitments: [
    {
      provider: "Shopee PayLater",
      dueDate: "18 May",
      monthly: 89,
      remainingMonths: 3,
      status: "due",
    },
    {
      provider: "Grab PayLater",
      dueDate: "22 May",
      monthly: 45,
      remainingMonths: 4,
      status: "due",
    },
    {
      provider: "Atome",
      dueDate: "26 May",
      monthly: 80,
      remainingMonths: 2,
      status: "paid",
    },
  ],
};

const sections = [
  { id: "home", key: "home" },
  { id: "heartbeat", key: "heartbeat" },
  { id: "budget", key: "budget" },
  { id: "transactions", key: "transactions" },
  { id: "bnpl", key: "bnpl" },
  { id: "timeline", key: "timeline" },
  { id: "categories", key: "categories" },
] as const;

function formatCurrency(amount: number) {
  return `RM${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function riskStyles(risk: RiskStatus) {
  if (risk === "high") {
    return {
      badge: "border-red-500/30 bg-red-500/10 text-red-200",
      icon: <ShieldAlert className="h-4 w-4" />,
    };
  }

  if (risk === "medium") {
    return {
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      icon: <CircleAlert className="h-4 w-4" />,
    };
  }

  return {
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    icon: <ShieldCheck className="h-4 w-4" />,
  };
}

function StatCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-xs text-zinc-400">{meta}</p>
      </div>
    </motion.div>
  );
}

export function BehaviorDashboard() {
  const [locale, setLocale] = useState<Locale>("en");
  const [purchaseTriggered, setPurchaseTriggered] = useState(true);
  const pulse = useDashboardPulse();
  const chartsReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const copy = dashboardCopy[locale];

  const derived = useMemo(() => {
    const balance = purchaseTriggered
      ? sarahDemo.currentBalance - sarahDemo.plannedPurchaseAmount
      : sarahDemo.currentBalance;
    const budgetUsedAmount = purchaseTriggered
      ? sarahDemo.monthlySpending + sarahDemo.plannedPurchaseAmount
      : sarahDemo.monthlySpending;
    const budgetUsedPct = clamp(
      (budgetUsedAmount / sarahDemo.monthlyBudget) * 100,
      0,
      100
    );
    const dailySurvival = balance / sarahDemo.daysUntilSalary;
    const risk = purchaseTriggered
      ? sarahDemo.projectedRisk
      : sarahDemo.currentRisk;
    return { balance, budgetUsedAmount, budgetUsedPct, dailySurvival, risk };
  }, [purchaseTriggered]);

  const riskUi = riskStyles(derived.risk);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section id="home" className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-lg border border-white/10 bg-[#071412] text-white"
        >
          <div className="border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">
                    {copy.product}
                  </p>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {copy.headline}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-300">
                    {copy.subheadline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-lg border border-white/10 bg-white/5 p-1">
                <span className="px-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                  {copy.language}
                </span>
                <Button
                  size="sm"
                  variant={locale === "en" ? "default" : "ghost"}
                  onClick={() => setLocale("en")}
                  aria-pressed={locale === "en"}
                >
                  EN
                </Button>
                <Button
                  size="sm"
                  variant={locale === "bm" ? "default" : "ghost"}
                  onClick={() => setLocale("bm")}
                  aria-pressed={locale === "bm"}
                >
                  BM
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                <span>{copy.profile}</span>
                <span className="text-zinc-500">•</span>
                <span>{copy.location}</span>
                <span className="text-zinc-500">•</span>
                <span>{copy.cycle}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={copy.currentBalance}
                  value={formatCurrency(derived.balance)}
                  meta={copy.afterBills}
                  icon={<Wallet className="h-4 w-4" />}
                />
                <StatCard
                  label={copy.daysUntilSalary}
                  value={`${sarahDemo.daysUntilSalary}`}
                  meta={`${copy.nextSalary}: ${copy.salaryDate}`}
                  icon={<CalendarClock className="h-4 w-4" />}
                />
                <StatCard
                  label={copy.dailySurvival}
                  value={formatCurrency(derived.dailySurvival)}
                  meta={copy.safeToSpend}
                  icon={<Landmark className="h-4 w-4" />}
                />
                <StatCard
                  label={copy.riskStatus}
                  value={derived.risk.toUpperCase()}
                  meta={purchaseTriggered ? copy.interventionReason : copy.safeReason}
                  icon={riskUi.icon}
                />
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <AlertTriangle className="h-4 w-4" />
                      <h2 className="text-base font-semibold">{copy.nudgeTitle}</h2>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-300">
                      {copy.nudgeBody}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
                      riskUi.badge
                    )}
                  >
                    {riskUi.icon}
                    {copy.riskStatus}: {derived.risk}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {copy.plannedPurchase}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(sarahDemo.plannedPurchaseAmount)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {copy.merchant} · {copy.dress}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {copy.projectedBalance}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(derived.balance)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {copy.currentBalance}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      {copy.projectedDaily}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(derived.dailySurvival)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {copy.daysUntilSalary}: {sarahDemo.daysUntilSalary}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => setPurchaseTriggered(true)}>
                    {copy.nudgeCta}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPurchaseTriggered(false)}
                  >
                    {copy.resetCta}
                  </Button>
                  {purchaseTriggered ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="font-medium">{copy.dontBuy}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.monthlyBudget}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {formatCurrency(sarahDemo.monthlyBudget)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.budgetUsage}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {derived.budgetUsedPct.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  animate={{ width: `${derived.budgetUsedPct}%` }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "h-full rounded-full",
                    derived.risk === "high"
                      ? "bg-red-500"
                      : derived.risk === "medium"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  )}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.monthlySpend}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(derived.budgetUsedAmount)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.fixedCommitments}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(sarahDemo.fixedCommitments)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.bnplDue}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCurrency(sarahDemo.bnplDueThisMonth)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {copy.note}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {copy.focusNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-[57px] z-30 -mx-4 overflow-x-auto border-y border-zinc-900/5 bg-zinc-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-zinc-900/10 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-emerald-400/50 hover:text-emerald-700"
              >
                {copy[section.key]}
              </a>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <RefreshCw className={cn("h-4 w-4", pulse.loading && "animate-spin")} />
              <span>Live pulse</span>
            </div>
            <p className="text-sm leading-6 text-zinc-600">
              Refreshes every 15 seconds using the current budget summary, freeze state, and gamification status.
            </p>
            <p className="text-xs text-zinc-500">
              {pulse.lastUpdated
                ? `Last updated ${pulse.lastUpdated.toLocaleTimeString("en-MY", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}`
                : "Waiting for first refresh"}
            </p>
            {pulse.errors.length ? (
              <p className="text-xs text-amber-600">
                Fallback data active: {pulse.errors[0]}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Budget runway
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatCurrency(pulse.budget.remaining)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {formatCurrency(pulse.budget.daily_safe_amount)} / day for {pulse.budget.days_left} days
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-zinc-900">
              <LockKeyhole className="h-4 w-4 text-sky-600" />
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Freeze status</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {pulse.freeze.active ? pulse.freeze.type.toUpperCase() : "ACTIVE"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{pulse.freeze.message}</p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-zinc-900">
              <Flame className="h-4 w-4 text-amber-500" />
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">XP and streak</p>
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {pulse.gamification.xp} XP
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Level {pulse.gamification.level} · {pulse.gamification.streak} day streak
            </p>
          </div>
        </motion.div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section id="heartbeat" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {copy.heartbeat}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.heartbeatBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {copy.currentBalance}
                </p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">
                  {formatCurrency(sarahDemo.currentBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {copy.nextSalary}
                </p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">
                  {copy.salaryDate}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {copy.riskStatus}
                </p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">
                  {sarahDemo.currentRisk.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sarahDemo.heartbeat}
                    margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="heartbeatFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#52525b" }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#52525b" }}
                      tickFormatter={(value) => `RM${value}`}
                      width={44}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelStyle={{ color: "#18181b" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#059669"
                      fill="url(#heartbeatFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full animate-pulse rounded-lg bg-zinc-100" />
              )}
            </div>
          </div>
        </section>

        <section id="budget" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">{copy.budget}</h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.budgetBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="space-y-4">
              {[
                {
                  label: copy.monthlySpend,
                  value: sarahDemo.monthlySpending,
                  total: sarahDemo.monthlyBudget,
                  color: "bg-emerald-500",
                },
                {
                  label: copy.bnplDue,
                  value: sarahDemo.bnplDueThisMonth,
                  total: sarahDemo.monthlyBudget,
                  color: "bg-amber-400",
                },
                {
                  label: copy.fixedCommitments,
                  value: sarahDemo.fixedCommitments,
                  total: sarahDemo.monthlyBudget,
                  color: "bg-sky-500",
                },
              ].map((item) => {
                const pct = clamp((item.value / item.total) * 100, 0, 100);
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-800">{item.label}</span>
                      <span className="text-zinc-500">
                        {formatCurrency(item.value)} / {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.35 }}
                        className={cn("h-full rounded-full", item.color)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="transactions" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {copy.transactions}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.transactionsBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="divide-y divide-zinc-100">
              {sarahDemo.recentTransactions.map((transaction) => {
                const income = transaction.amount > 0;
                return (
                  <motion.div
                    key={`${transaction.merchant}-${transaction.date}`}
                    whileHover={{ backgroundColor: "rgba(244, 244, 245, 0.8)" }}
                    className="flex items-center justify-between gap-4 px-4 py-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          income
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700"
                        )}
                      >
                        {income ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">
                          {transaction.merchant}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-semibold",
                          income ? "text-emerald-600" : "text-zinc-900"
                        )}
                      >
                        {income ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-zinc-500">{transaction.tag}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="bnpl" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">{copy.bnpl}</h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.bnplBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="space-y-3">
              {sarahDemo.bnplCommitments.map((item) => (
                <div
                  key={item.provider}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-900">
                        <CreditCard className="h-4 w-4 text-amber-500" />
                        <p className="font-medium">{item.provider}</p>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {copy.due}: {item.dueDate} · {item.remainingMonths} mo left
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-zinc-950">
                        {formatCurrency(item.monthly)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          item.status === "due"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {item.status === "due" ? copy.due : copy.paid}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="timeline" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {copy.timeline}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.timelineBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="h-72 w-full">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sarahDemo.spendingTimeline}
                    margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#52525b" }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#52525b" }}
                      tickFormatter={(value) => `RM${value}`}
                      width={42}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      labelStyle={{ color: "#18181b" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#22c55e"
                      fill="url(#timelineFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full animate-pulse rounded-lg bg-zinc-100" />
              )}
            </div>
          </div>
        </section>

        <section id="categories" className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {copy.categories}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              {copy.categoryBody}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="h-80 w-full">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sarahDemo.categoryProgress.map((item) => ({
                      name: item.name,
                      progress: Math.round((item.spent / item.budget) * 100),
                      color: item.color,
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#f4f4f5" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 160]}
                      tick={{ fontSize: 12, fill: "#52525b" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={88}
                      tick={{ fontSize: 12, fill: "#27272a" }}
                    />
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      labelStyle={{ color: "#18181b" }}
                    />
                    <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
                      {sarahDemo.categoryProgress.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full animate-pulse rounded-lg bg-zinc-100" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
