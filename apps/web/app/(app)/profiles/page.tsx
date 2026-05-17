"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { DailyLogin } from "@/components/features/profile/DailyLogin";
import { ConnectionsList } from "@/components/features/profile/ConnectionsList";
import { ChallengeCard } from "@/components/features/buddies/ChallengeCard";
import { PersonaCard } from "@/components/features/persona/PersonaCard";
import { XPProgressBar } from "@/components/features/persona/XPProgressBar";
import { AchievementGrid } from "@/components/features/persona/AchievementGrid";
import { VirtualPet, type PetType } from "@/components/features/gamification/VirtualPet";
import { usePersona } from "@/hooks/usePersona";
import { Loader2, LayoutDashboard, Medal, Users, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTextSize, type FontSize } from "@/components/ui/TextSizeProvider";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "Overview",   icon: LayoutDashboard },
  { id: "achievements",  label: "Badges",     icon: Medal },
  { id: "community",     label: "Community",  icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Pet options ──────────────────────────────────────────────────────────────

const PET_OPTIONS: { type: PetType; label: string; emoji: string }[] = [
  { type: "squirrel", label: "Squirrel", emoji: "🐿️" },
  { type: "fox",      label: "Fox",      emoji: "🦊" },
  { type: "raccoon",  label: "Raccoon",  emoji: "🦝" },
  { type: "rabbit",   label: "Rabbit",   emoji: "🐰" },
];

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilesPage() {
  const { persona, loading: personaLoading } = usePersona();
  const [petType, setPetType] = useState<PetType>("squirrel");
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28">
      {/* Page title */}
      <h1 className="font-headline text-3xl font-bold text-foreground mb-5">My Profile</h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-zinc-100/80 p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-sans text-xs font-bold transition-all",
              tab === t.id
                ? "bg-white text-primary shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <OverviewTab
            key="overview"
            persona={persona}
            personaLoading={personaLoading}
            petType={petType}
            setPetType={setPetType}
          />
        )}
        {tab === "achievements" && <AchievementsTab key="achievements" />}
        {tab === "community"    && <CommunityTab key="community" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  persona,
  personaLoading,
  petType,
  setPetType,
}: {
  persona: ReturnType<typeof usePersona>["persona"];
  personaLoading: boolean;
  petType: PetType;
  setPetType: (t: PetType) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Hero stat card */}
      <ProfileHeader />

      {/* Persona loading */}
      {personaLoading && (
        <div className="rounded-2xl border border-border bg-white p-5 flex items-center justify-center gap-3 chunky-shadow">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="font-sans text-sm text-muted">Analyzing your spending persona…</span>
        </div>
      )}

      {/* Persona + XP/Pet */}
      {persona && (
        <>
          {/* Spending persona — full width */}
          <div className="space-y-2">
            <SectionLabel>Your spending persona</SectionLabel>
            <PersonaCard
              type={persona.type}
              name={persona.name}
              emoji={persona.emoji}
              description={persona.description}
              level={persona.level}
              confidence={persona.confidence}
              explanation={persona.explanation}
              suggestedInterventionRule={persona.suggested_intervention_rule}
            />
          </div>

          {/* Behaviour signals */}
          {persona.top_signals?.length ? (
            <div className="space-y-2">
              <SectionLabel>Behaviour signals</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {persona.top_signals.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-surface-muted border border-border px-3 py-1 font-sans text-xs text-muted font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* XP Progress */}
          <div className="space-y-2">
            <SectionLabel>XP progress</SectionLabel>
            <div className="rounded-2xl border-b-4 border-primary/20 bg-white chunky-shadow p-4">
              <XPProgressBar
                current={persona.xp}
                max={persona.xp_to_next}
                level={persona.level}
              />
            </div>
          </div>

          {/* Pet companion */}
          <div className="space-y-2">
            <SectionLabel>Companion</SectionLabel>
            <div className="rounded-2xl border-b-4 border-primary/20 bg-white chunky-shadow p-4">
              {/* Species picker */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                {PET_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setPetType(opt.type)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-sans text-xs font-bold transition-all border",
                      petType === opt.type
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-zinc-50 border-zinc-200 text-muted hover:border-primary/30"
                    )}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <VirtualPet xp={persona.xp} streak={persona.streak ?? 0} petType={petType} />
            </div>
          </div>

          {/* ── Display settings ── */}
          <div className="space-y-2">
            <SectionLabel>Display settings</SectionLabel>
            <TextSizePicker />
          </div>

          {/* ── Advanced ── */}
          <div className="space-y-2">
            <SectionLabel>Advanced</SectionLabel>
            <ReplayOnboardingButton />
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Replay Onboarding Button ──────────────────────────────────────────────────

function ReplayOnboardingButton() {
  const handleReplay = () => {
    // Reset onboarding flag so root page shows onboarding flow
    try {
      const guestData = localStorage.getItem("bb_guest_data");
      if (guestData) {
        const parsed = JSON.parse(guestData);
        parsed.onboarding = parsed.onboarding || {};
        parsed.onboarding.questions_answered = false;
        localStorage.setItem("bb_guest_data", JSON.stringify(parsed));
      }
      // Also ensure guest mode is on
      localStorage.setItem("bb_guest_mode", "true");
    } catch {
      // ignore
    }
    window.location.href = "/onboarding";
  };

  return (
    <button
      onClick={handleReplay}
      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left hover:border-amber-300 hover:bg-amber-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <div>
          <p className="font-sans text-sm font-semibold text-zinc-700">Replay Onboarding</p>
          <p className="font-sans text-[11px] text-zinc-400">
            See the 5-question intro, persona roast, and bank statement flow again
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

function AchievementsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <AchievementGrid />
    </motion.div>
  );
}

// ─── Community Tab ────────────────────────────────────────────────────────────

function CommunityTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Active challenges */}
      <div className="space-y-3">
        <SectionLabel>Active challenges</SectionLabel>
        <div className="space-y-2.5">
          <ChallengeCard
            title="No Shopee Week"
            description="Don't buy anything on Shopee for 7 days"
            participants={12}
            daysLeft={3}
            joined={true}
          />
          <ChallengeCard
            title="RM50 Food Budget"
            description="Keep food spending under RM50 for 3 days"
            participants={8}
            daysLeft={5}
            joined={false}
          />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Leaderboard</SectionLabel>
          <span className="font-sans text-[10px] font-bold text-muted bg-zinc-100 px-2 py-0.5 rounded-full">
            Weekly
          </span>
        </div>
        <ConnectionsList />
      </div>

      {/* Daily streak */}
      <div className="space-y-3">
        <SectionLabel>This week</SectionLabel>
        <DailyLogin />
      </div>
    </motion.div>
  );
}

// ─── Text Size Picker ─────────────────────────────────────────────────────────

const SIZE_OPTIONS: { value: FontSize; label: string; aLabel: string; desc: string }[] = [
  { value: "sm", aLabel: "A-", label: "Kecil",      desc: "Compact" },
  { value: "md", aLabel: "A",  label: "Biasa",      desc: "Default" },
  { value: "lg", aLabel: "A+", label: "Besar",      desc: "Larger"  },
  { value: "xl", aLabel: "A++",label: "Besar Gila", desc: "Biggest" },
];

function TextSizePicker() {
  const { size, setSize } = useTextSize();

  return (
    <div className="rounded-2xl border-b-4 border-primary/20 bg-white chunky-shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-4 h-4 text-primary" />
        <p className="font-sans text-sm font-bold text-foreground">Text Size</p>
        <span className="ml-auto font-sans text-[10px] text-muted bg-zinc-100 px-2 py-0.5 rounded-full">
          Saves automatically
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSize(opt.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 transition-all",
              size === opt.value
                ? "border-primary bg-primary-light shadow-sm"
                : "border-zinc-200 bg-zinc-50 hover:border-primary/40"
            )}
          >
            <span className={cn(
              "font-headline font-bold leading-none",
              opt.value === "sm" ? "text-base"  :
              opt.value === "md" ? "text-xl"    :
              opt.value === "lg" ? "text-2xl"   : "text-3xl",
              size === opt.value ? "text-primary" : "text-foreground"
            )}>
              {opt.aLabel}
            </span>
            <span className={cn(
              "font-sans text-[9px] font-bold uppercase tracking-wide",
              size === opt.value ? "text-primary" : "text-muted"
            )}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 p-3">
        <p className="font-sans text-[10px] text-muted uppercase tracking-widest mb-1.5">Preview</p>
        <p className="font-headline font-bold text-foreground leading-tight" style={{ fontSize: "1.1em" }}>
          BajetBuddy 💰
        </p>
        <p className="font-sans text-muted mt-0.5" style={{ fontSize: "0.85em" }}>
          Jimat sikit-sikit, lama-lama jadi bukit.
        </p>
      </div>
    </div>
  );
}
