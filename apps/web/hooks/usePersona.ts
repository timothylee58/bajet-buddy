"use client";

import { useState, useEffect, useMemo } from "react";
import { getPersona } from "@/lib/api";
import { useGuestMode } from "@/hooks/useGuestMode";
import type { PersonaAnalysis } from "@/types";

const MOCK_PERSONA: PersonaAnalysis = {
  type: "midnight_shopee_queen",
  name: "Midnight Shopee Queen",
  emoji: "🛍️",
  description:
    "You love late-night deals and flash sales. Your cart is always full — but your wallet doesn't always agree.",
  level: 2,
  xp: 420,
  xp_to_next: 500,
  streak: 7,
  explanation:
    "Late-night shopping concentration and repeated marketplace merchants are dominating current behaviour.",
  suggested_intervention_rule:
    "Push a hard wishlist delay for shopping after 10PM when runway is below RM40/day.",
  confidence: 88,
  top_signals: [
    "Top category: shopping",
    "Repeated merchant: Shopee Malaysia",
    "Late-night shopping spikes",
  ],
};

export function usePersona() {
  const [apiPersona, setApiPersona] = useState<PersonaAnalysis | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const { isGuest, guestData } = useGuestMode();

  useEffect(() => {
    if (isGuest) return;
    getPersona()
      .then((data) => setApiPersona(data as PersonaAnalysis))
      .catch(() => setApiPersona(MOCK_PERSONA))
      .finally(() => setApiLoading(false));
  }, [isGuest]);

  const persona = useMemo<PersonaAnalysis | null>(() => {
    if (!isGuest) return apiPersona;
    if (!guestData.persona) return null;
    return {
      ...MOCK_PERSONA,
      ...(guestData.persona as Partial<PersonaAnalysis>),
      xp: guestData.xp,
      streak: guestData.streak,
    };
  }, [isGuest, guestData.persona, guestData.xp, guestData.streak, apiPersona]);

  const loading = isGuest ? false : apiLoading;

  return { persona, loading };
}
