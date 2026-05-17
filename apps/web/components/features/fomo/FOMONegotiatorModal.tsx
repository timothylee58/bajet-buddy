"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Loader2, CheckCircle2, Flame } from "lucide-react";
import { cn, formatRM } from "@/lib/utils";
import { FOMOHeatGauge } from "./FOMOHeatGauge";
import { ImpulseBountyJar } from "./ImpulseBountyJar";
import { useFOMONegotiator } from "@/hooks/useFOMONegotiator";
import type {
  EmotionalState,
  FOMOChoice,
  FOMONegotiateRequest,
  FOMOOption,
  PersonaCode,
} from "@/types";

interface FOMONegotiatorModalProps {
  open: boolean;
  request: FOMONegotiateRequest | null;
  onClose: () => void;
}

// ─── Emotional State Picker ────────────────────────────────────────────────────

const EMOTIONS: { state: EmotionalState; emoji: string; label: string; sublabel: string }[] = [
  { state: "stressed", emoji: "😤", label: "Stressed", sublabel: "Need retail therapy" },
  { state: "bored", emoji: "😴", label: "Bored", sublabel: "Doom-scrolling again" },
  { state: "happy", emoji: "😊", label: "Happy", sublabel: "Feeling generous" },
  { state: "yolo", emoji: "🤑", label: "YOLO", sublabel: "Treat yourself mode" },
  { state: "lapar", emoji: "😋", label: "Lapar", sublabel: "Hungry = bad decisions" },
];

function EmotionPicker({
  selected,
  onSelect,
}: {
  selected: EmotionalState;
  onSelect: (e: EmotionalState) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {EMOTIONS.map((e) => (
        <motion.button
          key={e.state}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onSelect(e.state)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-all",
            selected === e.state
              ? "border-violet-400 bg-violet-50 shadow-sm"
              : "border-zinc-200 bg-white hover:border-zinc-300"
          )}
        >
          <span className="text-2xl">{e.emoji}</span>
          <span className="text-[10px] font-semibold text-zinc-700">{e.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Persona Selector ──────────────────────────────────────────────────────────

const PERSONAS: { code: PersonaCode; emoji: string; name: string; unlock: string }[] = [
  { code: "pak_cik_audit", emoji: "🧓", name: "Pak Cik", unlock: "Always" },
  { code: "kak_therapist", emoji: "💆", name: "Kak Therapist", unlock: "Onboarding" },
  { code: "meme_goblin", emoji: "🐸", name: "Meme Goblin", unlock: "7d streak" },
  { code: "ice_cfo", emoji: "🧊", name: "Ice CFO", unlock: "500 XP" },
  { code: "hype_man", emoji: "🔥", name: "Hype Man", unlock: "3 walk-aways" },
];

function PersonaPicker({
  selected,
  onSelect,
}: {
  selected: PersonaCode;
  onSelect: (c: PersonaCode) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PERSONAS.map((p) => (
        <button
          key={p.code}
          onClick={() => onSelect(p.code)}
          className={cn(
            "flex shrink-0 flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-2 text-center transition-all",
            selected === p.code
              ? "border-violet-400 bg-violet-50"
              : "border-zinc-200 bg-white hover:border-zinc-300"
          )}
        >
          <span className="text-xl">{p.emoji}</span>
          <span className="text-[10px] font-semibold text-zinc-800">{p.name}</span>
          <span className="text-[9px] text-zinc-400">{p.unlock}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────

function OptionCard({
  option,
  choiceKey,
  onChoose,
}: {
  option: FOMOOption;
  choiceKey: FOMOChoice;
  onChoose: (c: FOMOChoice) => void;
}) {
  const styles = {
    cash: { border: "border-zinc-200 hover:border-zinc-400", bg: "bg-white" },
    bnpl: { border: "border-amber-300 hover:border-amber-500", bg: "bg-amber-50" },
    walk_away: { border: "border-emerald-300 hover:border-emerald-500", bg: "bg-emerald-50" },
  }[choiceKey];

  const xpColor = option.xp_delta > 0 ? "text-emerald-600" : option.xp_delta < 0 ? "text-red-500" : "text-zinc-400";

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChoose(choiceKey)}
      className={cn("relative w-full rounded-2xl border-2 p-4 text-left transition-colors", styles.border, styles.bg)}
    >
      {option.recommended && (
        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
          ✓ Recommended
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{option.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 text-sm">{option.label}</p>
          <p className="text-xs text-zinc-600 mt-0.5 leading-5">{option.impact_summary}</p>
          {option.warning && (
            <p className="text-[11px] text-amber-600 mt-1">{option.warning}</p>
          )}
          {choiceKey === "walk_away" && option.bounty_rm > 0 && (
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              🫙 +RM{option.bounty_rm.toFixed(2)} to Bounty Jar
            </p>
          )}
          {choiceKey === "walk_away" && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock className="h-3 w-3" />
              12-hour cooldown — breathe, then reconsider
            </div>
          )}
        </div>
        <div className={cn("shrink-0 text-sm font-bold", xpColor)}>
          {option.xp_delta > 0 ? `+${option.xp_delta}` : option.xp_delta !== 0 ? String(option.xp_delta) : "±0"} XP
        </div>
      </div>
    </motion.button>
  );
}

// ─── Resolution View ─────────────────────────────────────────────────────────

function ResolutionView({
  resolution,
  onClose,
}: {
  resolution: NonNullable<ReturnType<typeof useFOMONegotiator>["resolution"]>;
  onClose: () => void;
}) {
  const isWalkAway = resolution.cooldown_until !== null;
  const bigEmoji = isWalkAway ? "🧘" : resolution.loot_box_unlocked ? "🎁" : resolution.xp_delta < 0 ? "😬" : "✅";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4 py-2"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-6xl"
        >
          {bigEmoji}
        </motion.div>
        <p className="font-bold text-zinc-900">
          {isWalkAway ? "Walked away — respect!" : resolution.loot_box_unlocked ? "Bounty Jar maxed!" : "Decision logged."}
        </p>
        <p className="text-sm text-zinc-500 leading-6 max-w-[280px] mx-auto">{resolution.message}</p>
      </div>

      {/* Persona reaction */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 italic text-center">
        &ldquo;{resolution.persona_reaction}&rdquo;
      </div>

      {/* XP */}
      {resolution.xp_delta !== 0 && (
        <div className={cn(
          "mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
          resolution.xp_delta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
        )}>
          {resolution.xp_delta > 0 ? `+${resolution.xp_delta} XP` : `${resolution.xp_delta} XP`}
        </div>
      )}

      {/* Walk-away streak */}
      {isWalkAway && resolution.walk_away_streak > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-600">
          <Flame className="h-4 w-4" />
          {resolution.walk_away_streak} walk-away streak
        </div>
      )}

      {/* Heat gauge */}
      <FOMOHeatGauge level={resolution.heat_level} delta={resolution.heat_delta} />

      {/* Bounty jar */}
      <ImpulseBountyJar
        amountRm={resolution.bounty_jar_rm}
        earnedRm={isWalkAway ? resolution.bounty_earned_rm : undefined}
        lootUnlocked={resolution.loot_box_unlocked}
      />

      {/* Cooldown */}
      {isWalkAway && resolution.cooldown_until && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4" />
            Come back after {new Date(resolution.cooldown_until).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            If you still want it after 12 hours, it&apos;s not impulse — it&apos;s a real decision.
          </p>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Got it
      </button>
    </motion.div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function FOMONegotiatorModal({ open, request, onClose }: FOMONegotiatorModalProps) {
  const {
    phase, negotiation, resolution, emotionalState, personaPreference,
    error, open: startFlow, setEmotion, setPersona, confirmEmotion, choose, reset,
  } = useFOMONegotiator();

  function handleOpen() {
    if (request) startFlow(request);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleChoose(choice: FOMOChoice) {
    if (!request) return;
    choose(choice, request.amount, request.category);
  }

  return (
    <AnimatePresence onExitComplete={reset}>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onAnimationComplete={(def) => {
              if (def === "animate" && phase === "idle" && request) handleOpen();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white shadow-2xl max-h-[92dvh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <div>
                  <span className="font-bold text-zinc-900 text-sm">FOMO Negotiator</span>
                  {negotiation && (
                    <span className="ml-2 text-xs text-zinc-400">
                      {negotiation.persona.emoji} {negotiation.persona.name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4 space-y-5">
              {/* ── Step 1: Emotional State ── */}
              {phase === "emotion" && request && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-zinc-900">{formatRM(request.amount)}</p>
                    <p className="text-sm text-zinc-500">{request.item_name} @ {request.merchant}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-zinc-700 text-center">
                      Aik, before we talk — how you feeling rn?
                    </p>
                    <EmotionPicker selected={emotionalState} onSelect={setEmotion} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 text-center">
                      Who should intervene?
                    </p>
                    <PersonaPicker selected={personaPreference} onSelect={setPersona} />
                  </div>

                  <button
                    onClick={() => confirmEmotion(request)}
                    className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    Let&apos;s Negotiate →
                  </button>
                </motion.div>
              )}

              {/* ── Loading ── */}
              {phase === "loading" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <p className="text-sm text-zinc-500">Consulting your advisor...</p>
                </div>
              )}

              {/* ── Error ── */}
              {phase === "error" && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button onClick={handleClose} className="mt-3 text-xs text-red-500 underline">Close</button>
                </div>
              )}

              {/* ── Step 2: Negotiation ── */}
              {phase === "negotiating" && negotiation && request && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Amount + persona */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900">{formatRM(request.amount)}</p>
                      <p className="text-xs text-zinc-400">{request.item_name} @ {request.merchant}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl">{negotiation.persona.emoji}</span>
                      <span className="text-[10px] text-zinc-400">{negotiation.persona.name}</span>
                    </div>
                  </div>

                  {/* Heat gauge */}
                  <FOMOHeatGauge level={negotiation.heat_level} />

                  {/* Persona quip */}
                  <div className="rounded-2xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm font-medium text-violet-800 text-center italic">
                    &ldquo;{negotiation.persona_quip}&rdquo;
                  </div>

                  {/* Validation + Trap */}
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">We get it</p>
                      <p className="text-sm text-zinc-700 leading-6">{negotiation.fomo_validation}</p>
                    </div>
                    <div className="border-t border-zinc-200 pt-3 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">But here&apos;s the trap</p>
                      <p className="text-sm text-zinc-700 leading-6">{negotiation.trap_exposure}</p>
                    </div>
                  </div>

                  {/* Regret probability */}
                  {negotiation.regret_probability !== undefined && negotiation.regret_probability > 0 && (
                    <div className={cn(
                      "rounded-2xl border px-4 py-3 space-y-1",
                      negotiation.regret_probability >= 70
                        ? "border-red-200 bg-red-50"
                        : negotiation.regret_probability >= 40
                        ? "border-amber-200 bg-amber-50"
                        : "border-zinc-200 bg-zinc-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          AI Regret Forecast
                        </span>
                        <span className={cn(
                          "text-sm font-bold",
                          negotiation.regret_probability >= 70 ? "text-red-600" :
                          negotiation.regret_probability >= 40 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {negotiation.regret_probability}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            negotiation.regret_probability >= 70 ? "bg-red-500" :
                            negotiation.regret_probability >= 40 ? "bg-amber-400" : "bg-emerald-500"
                          )}
                          style={{ width: `${negotiation.regret_probability}%` }}
                        />
                      </div>
                      {negotiation.heat_reasoning && (
                        <p className="text-[11px] text-zinc-400 italic">{negotiation.heat_reasoning}</p>
                      )}
                    </div>
                  )}

                  {/* Bounty jar */}
                  <ImpulseBountyJar amountRm={negotiation.bounty_jar_rm} />

                  {/* Walk-away streak */}
                  {negotiation.walk_away_streak > 0 && (
                    <div className="flex items-center gap-1.5 justify-center text-sm text-emerald-600 font-medium">
                      <Flame className="h-4 w-4" />
                      {negotiation.walk_away_streak} walk-away streak — keep it going!
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 text-center">
                      Your 3-way trade-off — pick one
                    </p>
                    <OptionCard option={negotiation.option_cash} choiceKey="cash" onChoose={handleChoose} />
                    <OptionCard option={negotiation.option_bnpl} choiceKey="bnpl" onChoose={handleChoose} />
                    <OptionCard option={negotiation.option_walk_away} choiceKey="walk_away" onChoose={handleChoose} />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
                    <CheckCircle2 className="h-3 w-3" />
                    Your choice is logged for your financial history
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Resolution ── */}
              {phase === "resolved" && resolution && (
                <ResolutionView resolution={resolution} onClose={handleClose} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
