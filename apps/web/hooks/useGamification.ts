"use client";

import { useCallback, useEffect, useState } from "react";
import { getGamificationStatus } from "@/lib/api";
import { useGuestMode } from "@/hooks/useGuestMode";
import type { GamificationStatus } from "@/types";

const DEFAULT_STATUS: GamificationStatus = {
  xp: 420,
  streak: 7,
  level: 2,
  level_name: "Jimat Sikit",
  level_min_xp: 200,
  xp_to_next: 500,
  progress_pct: 73.3,
  last_active_date: null,
};

export function useGamification() {
  const [status, setStatus] = useState<GamificationStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isGuest, guestData } = useGuestMode();

  const refresh = useCallback(async () => {
    if (isGuest) {
      const level = Math.floor(guestData.xp / 100) + 1;
      setStatus({
        xp: guestData.xp,
        streak: guestData.streak,
        level: level,
        level_name: level > 1 ? "Budget Warrior" : "Mamak Bro",
        level_min_xp: (level - 1) * 100,
        xp_to_next: level * 100,
        progress_pct: guestData.xp % 100,
        last_active_date: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getGamificationStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load gamification status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  return { status, loading, error, refresh };
}
