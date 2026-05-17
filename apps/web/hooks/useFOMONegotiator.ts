"use client";

import { useState, useCallback } from "react";
import { fomoNegotiate, fomoResolve } from "@/lib/api";
import type {
  FOMOChoice,
  FOMONegotiateRequest,
  FOMONegotiateResponse,
  FOMOResolveResponse,
} from "@/types";

type Phase = "idle" | "loading" | "negotiating" | "resolved" | "error";

interface UseFOMONegotiatorReturn {
  phase: Phase;
  negotiation: FOMONegotiateResponse | null;
  resolution: FOMOResolveResponse | null;
  error: string | null;
  open: (req: FOMONegotiateRequest) => Promise<void>;
  choose: (choice: FOMOChoice, amount: number, category: string) => Promise<void>;
  reset: () => void;
}

export function useFOMONegotiator(): UseFOMONegotiatorReturn {
  const [phase, setPhase] = useState<Phase>("idle");
  const [negotiation, setNegotiation] = useState<FOMONegotiateResponse | null>(null);
  const [resolution, setResolution] = useState<FOMOResolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async (req: FOMONegotiateRequest) => {
    setPhase("loading");
    setError(null);
    setResolution(null);
    try {
      const result = await fomoNegotiate(req);
      setNegotiation(result);
      setPhase("negotiating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }, []);

  const choose = useCallback(async (choice: FOMOChoice, amount: number, category: string) => {
    setPhase("loading");
    try {
      const result = await fomoResolve({ choice, amount, category });
      setResolution(result);
      setPhase("resolved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setNegotiation(null);
    setResolution(null);
    setError(null);
  }, []);

  return { phase, negotiation, resolution, error, open, choose, reset };
}
