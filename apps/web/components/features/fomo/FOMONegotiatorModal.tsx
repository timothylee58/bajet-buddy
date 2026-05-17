"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { cn, formatRM } from "@/lib/utils";
import { OverspentCards } from "./OverspentCards";
import { TaxModePanel } from "./TaxModePanel";
import { useFOMONegotiator } from "@/hooks/useFOMONegotiator";
import type { FOMONegotiateRequest, FOMOOption, FOMOChoice } from "@/types";

interface FOMONegotiatorModalProps {
  open: boolean;
  request: FOMONegotiateRequest | null;
  onClose: () => void;
}

function OptionCard({
  option,
  choiceKey,
  onChoose,
  disabled,
}: {
  option: FOMOOption;
  choiceKey: FOMOChoice;
  onChoose: (c: FOMOChoice) => void;
  disabled: boolean;
}) {
  const borderColor =
    choiceKey === "walk_away"
      ? "border-emerald-300 hover:border-emerald-400"
      : choiceKey === "bnpl"
      ? "border-amber-300 hover:border-amber-400"
      : "border-zinc-200 hover:border-zinc-400";

  const bgColor =
    choiceKey === "walk_away"
      ? "bg-emerald-50"
      : choiceKey === "bnpl"
      ? "bg-amber-50"
      : "bg-white";

  const xpColor =
    option.xp_delta > 0
      ? "text-emerald-600"
      : option.xp_delta < 0
      ? "text-red-500"
      : "text-zinc-400";

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChoose(choiceKey)}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-50",
        borderColor,
        bgColor
      )}
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
            <p className="text-[11px] text-amber-600 mt-1 leading-4">{option.warning}</p>
          )}
        </div>
        <div className={cn("shrink-0 text-sm font-bold", xpColor)}>
          {option.xp_delta > 0 ? `+${option.xp_delta}` : option.xp_delta !== 0 ? option.xp_delta : "±0"} XP
        </div>
      </div>
      {choiceKey === "walk_away" && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600">
          <Clock className="h-3 w-3" />
          12-hour cooldown — then reconsider
        </div>
      )}
    </motion.button>
  );
}

function ResolutionView({
  resolution,
  onClose,
}: {
  resolution: NonNullable<ReturnType<typeof useFOMONegotiator>["resolution"]>;
  onClose: () => void;
}) {
  const isWalkAway = resolution.cooldown_until !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-6xl"
      >
        {isWalkAway ? "🧘" : resolution.tax_mode_triggered_now ? "💸" : "✅"}
      </motion.div>

      <div className="space-y-1">
        <p className="text-lg font-bold text-zinc-900">
          {isWalkAway ? "Walking away — good call!" : resolution.tax_mode_triggered_now ? "Tax Mode Activated!" : "Decision logged."}
        </p>
        <p className="text-sm text-zinc-500 leading-6 max-w-[280px] mx-auto">{resolution.message}</p>
      </div>

      {resolution.xp_delta !== 0 && (
        <div className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
          resolution.xp_delta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
        )}>
          {resolution.xp_delta > 0 ? `+${resolution.xp_delta} XP` : `${resolution.xp_delta} XP`}
        </div>
      )}

      <OverspentCards used={resolution.overspent_cards_used} taxModeActive={resolution.tax_mode_active} />

      {resolution.tax_mode_triggered_now && (
        <TaxModePanel active taxRate={10} taxAmount={resolution.tax_amount} />
      )}

      {isWalkAway && resolution.cooldown_until && (
        <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4" />
            Cooldown until {new Date(resolution.cooldown_until).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            If you still want it after 12 hours, it&apos;s not impulse — it&apos;s a real need.
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

export function FOMONegotiatorModal({ open, request, onClose }: FOMONegotiatorModalProps) {
  const { phase, negotiation, resolution, error, open: startNegotiation, choose, reset } = useFOMONegotiator();

  function handleOpen() {
    if (request) startNegotiation(request);
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
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white shadow-2xl max-h-[92dvh] overflow-y-auto"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <span className="font-bold text-zinc-900 text-sm">FOMO Negotiator</span>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pb-8 pt-4 space-y-5">
              {phase === "loading" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-zinc-500">Thinking like a financial therapist...</p>
                </div>
              )}

              {phase === "error" && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button onClick={handleClose} className="mt-3 text-xs text-red-500 underline">
                    Close
                  </button>
                </div>
              )}

              {phase === "negotiating" && negotiation && request && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-zinc-900">{formatRM(request.amount)}</p>
                    <p className="text-sm text-zinc-500">{request.item_name} @ {request.merchant}</p>
                  </div>

                  <OverspentCards
                    used={negotiation.overspent_cards_used}
                    taxModeActive={negotiation.tax_mode_active}
                  />

                  {negotiation.tax_mode_active && (
                    <TaxModePanel
                      active
                      taxRate={negotiation.tax_rate_pct}
                      taxAmount={request.amount * (negotiation.tax_rate_pct / 100)}
                    />
                  )}

                  <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        We get it
                      </p>
                      <p className="text-sm text-zinc-700 leading-6">{negotiation.fomo_validation}</p>
                    </div>
                    <div className="border-t border-zinc-200 pt-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                        But here&apos;s the trap
                      </p>
                      <p className="text-sm text-zinc-700 leading-6">{negotiation.trap_exposure}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-center">
                      Your move — pick one
                    </p>
                    <OptionCard
                      option={negotiation.option_cash}
                      choiceKey="cash"
                      onChoose={handleChoose}
                      disabled={false}
                    />
                    <OptionCard
                      option={negotiation.option_bnpl}
                      choiceKey="bnpl"
                      onChoose={handleChoose}
                      disabled={false}
                    />
                    <OptionCard
                      option={negotiation.option_walk_away}
                      choiceKey="walk_away"
                      onChoose={handleChoose}
                      disabled={false}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
                    <CheckCircle2 className="h-3 w-3" />
                    Your choice is logged for your financial history
                  </div>
                </motion.div>
              )}

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
