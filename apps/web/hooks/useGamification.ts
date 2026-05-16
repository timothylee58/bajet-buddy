"use client";

import { useCallback, useEffect, useState } from "react";
import { getGamificationStatus } from "@/lib/api";
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGamificationStatus();
      setStatus(data);
    } catch (err) {
      setStatus(DEFAULT_STATUS);
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
