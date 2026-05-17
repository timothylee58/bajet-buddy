"use client";

import { useState, useCallback } from "react";
import { fomoNegotiate, fomoResolve, awardPetXP, getPetNudge } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import type {
  EmotionalState,
  FOMOChoice,
  FOMONegotiateRequest,
  FOMONegotiateResponse,
  FOMOResolveResponse,
  PersonaCode,
} from "@/types";

export type Phase = "idle" | "emotion" | "loading" | "negotiating" | "resolved" | "error";

interface UseFOMONegotiatorReturn {
  phase: Phase;
  negotiation: FOMONegotiateResponse | null;
  resolution: FOMOResolveResponse | null;
  emotionalState: EmotionalState;
  personaPreference: PersonaCode;
  error: string | null;
  open: (req: FOMONegotiateRequest) => void;
  setEmotion: (state: EmotionalState) => void;
  setPersona: (code: PersonaCode) => void;
  confirmEmotion: (req: FOMONegotiateRequest) => Promise<void>;
  choose: (choice: FOMOChoice, amount: number, category: string) => Promise<void>;
  reset: () => void;
}

export function useFOMONegotiator(): UseFOMONegotiatorReturn {
  const [phase, setPhase] = useState<Phase>("idle");
  const [negotiation, setNegotiation] = useState<FOMONegotiateResponse | null>(null);
  const [resolution, setResolution] = useState<FOMOResolveResponse | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("happy");
  const [personaPreference, setPersonaPreference] = useState<PersonaCode>("pak_cik_audit");
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const open = useCallback((_req: FOMONegotiateRequest) => {
    setError(null);
    setResolution(null);
    setNegotiation(null);
    setPhase("emotion");
  }, []);

  const setEmotion = useCallback((state: EmotionalState) => {
    setEmotionalState(state);
  }, []);

  const setPersona = useCallback((code: PersonaCode) => {
    setPersonaPreference(code);
  }, []);

  const confirmEmotion = useCallback(async (req: FOMONegotiateRequest) => {
    setPhase("loading");
    try {
      const result = await fomoNegotiate({
        ...req,
        emotional_state: emotionalState,
        persona_preference: personaPreference,
      });
      setNegotiation(result);
      setPhase("negotiating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }, [emotionalState, personaPreference]);

  const choose = useCallback(async (choice: FOMOChoice, amount: number, category: string) => {
    setPhase("loading");
    try {
      const result = await fomoResolve({ choice, amount, category, emotional_state: emotionalState });
      setResolution(result);
      setPhase("resolved");

      // ── Cross-agent actions based on choice ──────────────────────────
      const event = choice === "walk_away" ? "walk_away" : choice === "bnpl" ? "impulse_blocked" : "budget_under";
      const context = choice === "walk_away" ? "savings_goal_met" : "impulse_spend";

      // Pet Companion: mood response to every decision
      awardPetXP({ event, amount_rm: amount }).catch(() => {});
      getPetNudge({ context, amount_rm: amount, category }).catch(() => {});

      // BNPL: trigger PWA monitor check (backend already activated it via fomo_actions)
      // The PwaLockdownOverlay polls independently — this just ensures it picks up fast
      if (choice === "bnpl") {
        // Import dynamically to avoid circular dependency concerns
        import("@/lib/api").then(({ getPwaMonitorState }) => {
          getPwaMonitorState().catch(() => {});
        });
      }

      // Toast feedback
      if (choice === "walk_away") {
        toastSuccess(`Walked away! +20 XP · Streak: ${result.walk_away_streak}`);
      } else if (choice === "bnpl") {
        toastError("BNPL committed. PWA monitor activated — opening Shopee/Lazada triggers lockdown.", "BNPL_MONITOR_ACTIVE");
      } else {
        toastSuccess("Cash purchase logged. Budget updated.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setPhase("error");
      toastError(msg, "FOMO_FAILED");
    }
  }, [emotionalState, toastSuccess, toastError]);

  const reset = useCallback(() => {
    setPhase("idle");
    setNegotiation(null);
    setResolution(null);
    setError(null);
    setEmotionalState("happy");
    setPersonaPreference("pak_cik_audit");
  }, []);

  return {
    phase, negotiation, resolution, emotionalState, personaPreference,
    error, open, setEmotion, setPersona, confirmEmotion, choose, reset,
  };
}
