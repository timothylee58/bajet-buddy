"use client";

import { useState, useEffect } from "react";
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
  const [persona, setPersona] = useState<PersonaAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGuest, guestData } = useGuestMode();

  useEffect(() => {
    if (isGuest && guestData.persona) {
      setPersona({
        ...MOCK_PERSONA, // base types
        ...guestData.persona,
        xp: guestData.xp,
        streak: guestData.streak,
      });
      setLoading(false);
      return;
    }

    if (isGuest && !guestData.persona) {
      setPersona(null);
      setLoading(false);
      return;
    }

    getPersona()
      .then((data) => setPersona(data as PersonaAnalysis))
      .catch(() => setPersona(MOCK_PERSONA))
      .finally(() => setLoading(false));
  }, [isGuest, guestData]);

  return { persona, loading };
}
