"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getPetStatus, selectPetSpecies, awardPetXP } from "@/lib/api";
import { useGuestMode } from "@/hooks/useGuestMode";
import type {
  PetProfile,
  PetNudge,
  PetAccessory,
  PetSpecies,
  AwardXPRequest,
  AwardXPResponse,
} from "@/types";

export interface PetState {
  profile: PetProfile | null;
  nudge: PetNudge | null;
  availableAccessories: PetAccessory[];
  xpToNext: number;
  progressPct: number;
  loading: boolean;
  levelUpPending: boolean;
  newAccessory: PetAccessory | null;
}

export interface UsePetCompanionReturn extends PetState {
  refresh: (context?: string, amount_rm?: number, category?: string) => Promise<void>;
  changePet: (species: PetSpecies) => Promise<void>;
  award: (payload: AwardXPRequest) => Promise<AwardXPResponse | null>;
  dismissLevelUp: () => void;
  dismissAccessory: () => void;
}

export function usePetCompanion(): UsePetCompanionReturn {
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [nudge, setNudge] = useState<PetNudge | null>(null);
  const [availableAccessories, setAvailableAccessories] = useState<PetAccessory[]>([]);
  const [xpToNext, setXpToNext] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [newAccessory, setNewAccessory] = useState<PetAccessory | null>(null);
  const mountedRef = useRef(true);
  const { isGuest } = useGuestMode();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (context = "dashboard_open", amount_rm?: number, category?: string) => {
    if (isGuest) {
      setProfile(null);
      setNudge(null);
      setAvailableAccessories([]);
      setXpToNext(0);
      setProgressPct(0);
      return;
    }
    setLoading(true);
    try {
      const status = await getPetStatus(context, amount_rm, category);
      if (!mountedRef.current) return;
      setProfile(status.profile);
      // Use API nudge if present, else pick a random Malaysian fallback
      if (status.nudge) {
        setNudge(status.nudge);
      } else {
        const { MY_FALLBACK_NUDGES } = await import("@/components/features/pet/PetSpeechBubble");
        const pick = MY_FALLBACK_NUDGES[Math.floor(Math.random() * MY_FALLBACK_NUDGES.length)];
        setNudge({ message: pick.message, mood: pick.mood, xp_hint: null, trigger: "fallback" });
      }
      setAvailableAccessories(status.available_accessories);
      setXpToNext(status.xp_to_next_level);
      setProgressPct(status.progress_pct);
    } catch {
      // On failure, still show a random Malaysian nudge so the pet isn't silent
      try {
        const { MY_FALLBACK_NUDGES } = await import("@/components/features/pet/PetSpeechBubble");
        const pick = MY_FALLBACK_NUDGES[Math.floor(Math.random() * MY_FALLBACK_NUDGES.length)];
        if (mountedRef.current) setNudge({ message: pick.message, mood: pick.mood, xp_hint: null, trigger: "fallback" });
      } catch { /* truly silent */ }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const changePet = useCallback(async (species: PetSpecies) => {
    if (isGuest) return;
    try {
      const updated = await selectPetSpecies(species);
      if (!mountedRef.current) return;
      setProfile(updated);
    } catch {
      // ignore
    }
  }, [isGuest]);

  const award = useCallback(async (payload: AwardXPRequest): Promise<AwardXPResponse | null> => {
    if (isGuest) return null;
    try {
      const result = await awardPetXP(payload);
      if (!mountedRef.current) return result;
      setProfile((prev) => prev ? { ...prev, xp: result.total_xp, level: result.level } : prev);
      if (result.level_up) setLevelUpPending(true);
      if (result.new_accessory) setNewAccessory(result.new_accessory);
      return result;
    } catch {
      return null;
    }
  }, [isGuest]);

  const dismissLevelUp = useCallback(() => setLevelUpPending(false), []);
  const dismissAccessory = useCallback(() => setNewAccessory(null), []);

  return {
    profile, nudge, availableAccessories, xpToNext, progressPct,
    loading, levelUpPending, newAccessory,
    refresh, changePet, award, dismissLevelUp, dismissAccessory,
  };
}
