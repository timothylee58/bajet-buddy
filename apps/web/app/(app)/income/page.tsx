"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, TrendingUp, Wallet, Calculator, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRM } from "@/lib/utils";

// Malaysian tax brackets 2024 (Chargeable Income after reliefs)
const TAX_BRACKETS = [
  { upTo: 5000,   rate: 0,   accumulated: 0 },
  { upTo: 20000,  rate: 1,   accumulated: 0 },
  { upTo: 35000,  rate: 3,   accumulated: 150 },
  { upTo: 50000,  rate: 8,   accumulated: 600 },
  { upTo: 70000,  rate: 13,  accumulated: 1800 },
  { upTo: 100000, rate: 21,  accumulated: 4400 },
  { upTo: 250000, rate: 24,  accumulated: 10700 },
  { upTo: 400000, rate: 24.5,accumulated: 46700 },
  { upTo: 600000, rate: 25,  accumulated: 83450 },
  { upTo: Infinity, rate: 30, accumulated: 133450 },
];

// Standard EPF rate (employee): 11%
const EPF_RATE = 0.11;
// Standard SOCSO (employee) approx: 0.5% capped
const SOCSO_RATE = 0.005;
const SOCSO_CAP = 86.65; // monthly cap
// EIS rate: 0.2% capped
const EIS_RATE = 0.002;
const EIS_CAP = 7.90;

function calcMonthlyTax(annualChargeable: number): number {
  if (annualChargeable <= 5000) return 0;
  for (const bracket of TAX_BRACKETS) {
    if (annualChargeable <= bracket.upTo) {
      const prevBracket = TAX_BRACKETS[TAX_BRACKETS.indexOf(bracket) - 1];
      const excess = annualChargeable - (prevBracket?.upTo ?? 0);
      const tax = bracket.accumulated + (excess * bracket.rate) / 100;
      return tax / 12;
    }
  }
  return 0;
}

interface IncomeData {
  monthly_income: number;
  full_name: string;
  commute_hours_per_day: number;
  overtime_hours_per_week: number;
}

export default function IncomePage() {
  const [income, setIncome] = useState<IncomeData>({ monthly_income: 0, full_name: "", commute_hours_per_day: 0, overtime_hours_per_week: 0 });
  const [inputVal, setInputVal] = useState("");
  const [commute, setCommute] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const { data: profile } = await sb
        .from("profiles")
        .select("monthly_income, full_name, commute_hours_per_day, overtime_hours_per_week")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setIncome(profile as IncomeData);
        setInputVal(String(profile.monthly_income || ""));
        setCommute(profile.commute_hours_per_day ?? 0);
        setOvertime(profile.overtime_hours_per_week ?? 0);
      }
      setLoading(false);
    });
  }, []);

  const gross = parseFloat(inputVal) || 0;
  const annualGross = gross * 12;
  const apparentHourlyRate = gross > 0 ? gross / 176 : 0;
  const totalHoursPerMonth = 176 + commute * 22 + overtime * 4.33;
  const realHourlyRate = gross > 0 ? gross / totalHoursPerMonth : 0;

  // Standard reliefs estimate (individual + EPF)
  const epfMonthly = Math.min(gross * EPF_RATE, 740); // EPF cap RM740/month
  const socsoMonthly = Math.min(gross * SOCSO_RATE, SOCSO_CAP);
  const eisMonthly = Math.min(gross * EIS_RATE, EIS_CAP);
  const epfAnnual = epfMonthly * 12;
  const personalRelief = 9000; // individual
  const epfRelief = Math.min(epfAnnual, 4000); // EPF relief capped RM4000
  const totalRelief = personalRelief + epfRelief;
  const chargeableIncome = Math.max(0, annualGross - totalRelief);
  const monthlyTax = calcMonthlyTax(chargeableIncome);

  const totalDeductions = epfMonthly + socsoMonthly + eisMonthly + monthlyTax;
  const netMonthly = gross - totalDeductions;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { error: dbErr } = await sb
        .from("profiles")
        .update({ monthly_income: gross, commute_hours_per_day: commute, overtime_hours_per_week: overtime })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      setIncome((prev) => ({ ...prev, monthly_income: gross, commute_hours_per_day: commute, overtime_hours_per_week: overtime }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted hover:text-foreground active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Income & Tax</h1>
          <p className="font-sans text-xs text-muted">Gross salary, deductions & net take-home</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Gross Salary Input */}
          <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="font-headline text-lg font-bold">Monthly Gross Salary</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-2xl font-bold text-muted">RM</span>
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="0.00"
                className="flex-1 font-headline text-3xl font-bold text-foreground bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none py-1 transition-colors"
                min={0}
              />
            </div>
            <p className="font-sans text-xs text-muted mt-2">
              Enter your gross salary before any deductions
            </p>
          </section>

          {/* Breakdown Cards */}
          {gross > 0 && (
            <>
              {/* Deductions */}
              <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-red-500" />
                  <h2 className="font-headline text-lg font-bold">Monthly Deductions</h2>
                </div>
                <div className="space-y-3">
                  <DeductionRow label="EPF (11%)" amount={epfMonthly} color="text-red-600" />
                  <DeductionRow label="SOCSO (0.5%)" amount={socsoMonthly} color="text-red-600" />
                  <DeductionRow label="EIS (0.2%)" amount={eisMonthly} color="text-red-600" />
                  <DeductionRow
                    label="Est. Income Tax"
                    amount={monthlyTax}
                    color="text-red-600"
                    tooltip="Based on YA2024 brackets with standard individual relief (RM9,000) + EPF relief"
                  />
                  <div className="border-t border-border/30 pt-3 flex justify-between font-headline font-bold">
                    <span className="text-foreground">Total deductions</span>
                    <span className="text-red-600">-{formatRM(totalDeductions)}</span>
                  </div>
                </div>
              </section>

              {/* Net Take-Home */}
              <section className="bg-gradient-to-br from-primary-light to-primary p-5 rounded-2xl border-b-4 border-primary chunky-shadow text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-white/80" />
                  <span className="font-sans text-sm font-bold uppercase tracking-wider text-white/80">
                    Net Take-Home
                  </span>
                </div>
                <p className="font-headline text-4xl font-bold">{formatRM(netMonthly)}</p>
                <p className="font-sans text-sm text-white/80 mt-1">per month</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/15 rounded-xl p-2">
                    <p className="font-sans text-[10px] text-white/70 uppercase">Gross</p>
                    <p className="font-headline text-sm font-bold">{formatRM(gross)}</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-2">
                    <p className="font-sans text-[10px] text-white/70 uppercase">Deductions</p>
                    <p className="font-headline text-sm font-bold">-{formatRM(totalDeductions)}</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-2">
                    <p className="font-sans text-[10px] text-white/70 uppercase">Net</p>
                    <p className="font-headline text-sm font-bold">{formatRM(netMonthly)}</p>
                  </div>
                </div>
              </section>

              {/* Annual overview */}
              <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
                <h2 className="font-headline text-lg font-bold mb-3">Annual Overview</h2>
                <div className="space-y-2">
                  <Row label="Annual Gross" value={formatRM(annualGross)} />
                  <Row label="Annual EPF" value={`-${formatRM(epfMonthly * 12)}`} muted />
                  <Row label="Annual Tax (est.)" value={`-${formatRM(monthlyTax * 12)}`} muted />
                  <Row label="Chargeable Income" value={formatRM(chargeableIncome)} />
                  <div className="border-t border-border/30 pt-2">
                    <Row label="Annual Net" value={formatRM(netMonthly * 12)} bold />
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 bg-surface-muted rounded-xl p-3">
                  <Info className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
                  <p className="font-sans text-xs text-muted leading-5">
                    Tax estimate uses standard reliefs only (individual RM9,000 + EPF). Actual tax may differ. Consult LHDN or a tax agent for accurate filing.
                  </p>
                </div>
              </section>

              {/* Real Hourly Rate */}
              <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-5 h-5 text-tertiary" />
                  <h2 className="font-headline text-lg font-bold">Real Hourly Rate</h2>
                </div>
                <p className="font-sans text-xs text-muted mb-4">
                  Your RM {gross.toLocaleString()} salary is actually less per hour after commute &amp; overtime
                </p>

                {/* Commute slider */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <label className="font-sans text-sm text-foreground">Daily commute</label>
                    <span className="font-headline text-sm font-bold text-tertiary">{commute}h/day</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={0.5}
                    value={commute}
                    onChange={(e) => setCommute(parseFloat(e.target.value))}
                    className="w-full accent-tertiary"
                  />
                  <div className="flex justify-between font-sans text-[10px] text-muted mt-0.5">
                    <span>0h</span><span>4h</span>
                  </div>
                </div>

                {/* Overtime slider */}
                <div className="mb-5">
                  <div className="flex justify-between mb-1">
                    <label className="font-sans text-sm text-foreground">Weekly overtime</label>
                    <span className="font-headline text-sm font-bold text-tertiary">{overtime}h/week</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={overtime}
                    onChange={(e) => setOvertime(parseFloat(e.target.value))}
                    className="w-full accent-tertiary"
                  />
                  <div className="flex justify-between font-sans text-[10px] text-muted mt-0.5">
                    <span>0h</span><span>20h</span>
                  </div>
                </div>

                {/* Rate comparison card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-muted rounded-xl p-3 text-center">
                    <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Apparent rate</p>
                    <p className="font-headline text-xl font-bold text-foreground">
                      RM{apparentHourlyRate.toFixed(2)}
                    </p>
                    <p className="font-sans text-[10px] text-muted">per hour</p>
                  </div>
                  <div className="bg-tertiary/10 rounded-xl p-3 text-center border border-tertiary/20">
                    <p className="font-sans text-[10px] text-tertiary uppercase tracking-wide font-bold">Real rate</p>
                    <p className="font-headline text-xl font-bold text-tertiary">
                      RM{realHourlyRate.toFixed(2)}
                    </p>
                    <p className="font-sans text-[10px] text-tertiary/70">per hour</p>
                  </div>
                </div>

                {realHourlyRate > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="font-sans text-xs text-amber-800 text-center">
                      Every <strong>RM100</strong> you spend = <strong>{(100 / realHourlyRate).toFixed(1)} hours</strong> of your working life
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center font-sans">{error}</p>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || gross <= 0}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-headline font-bold text-lg rounded-2xl chunky-shadow active-press disabled:opacity-50 transition-all"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Income"}
          </button>

          {income.monthly_income > 0 && income.monthly_income !== gross && (
            <p className="text-center font-sans text-xs text-muted">
              Current saved: {formatRM(income.monthly_income)}/month
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DeductionRow({
  label,
  amount,
  color,
  tooltip,
}: {
  label: string;
  amount: number;
  color: string;
  tooltip?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1">
        <span className="font-sans text-sm text-foreground">{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-muted">
            <Info className="w-3 h-3" />
          </span>
        )}
      </div>
      <span className={`font-headline text-sm font-bold ${color}`}>
        -{formatRM(amount)}
      </span>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={`font-sans text-sm ${muted ? "text-muted" : "text-foreground"}`}>
        {label}
      </span>
      <span className={`font-headline text-sm ${bold ? "font-bold text-primary" : muted ? "text-muted" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
