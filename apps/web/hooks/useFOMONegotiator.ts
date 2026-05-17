"use client";

import { useState, useCallback } from "react";
import { fomoNegotiate, fomoResolve } from "@/lib/api";
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }, [emotionalState]);

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
