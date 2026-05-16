"use client";

import { useCallback, useEffect, useState } from "react";
import { getFreezeStatus, activateFreeze, overrideFreeze } from "@/lib/api";
import type { FreezeStatus } from "@/types";

const DEFAULT_STATUS: FreezeStatus = {
  active: false,
  type: "soft",
  reason: "manual",
  message: "Account is active.",
  can_override: true,
  override_cost_xp: 50,
};

export function useFreeze() {
  const [status, setStatus] = useState<FreezeStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getFreezeStatus();
      setStatus(data as FreezeStatus);
    } catch (err) {
      setStatus(DEFAULT_STATUS);
      setError(err instanceof Error ? err.message : "Unable to load freeze status");
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

  async function freeze(type: "soft" | "hard") {
    setError(null);
    try {
      const updated = await activateFreeze(type);
      setStatus(updated as FreezeStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to activate freeze");
    }
  }

  async function override() {
    setError(null);
    try {
      const updated = await overrideFreeze();
      setStatus(updated as FreezeStatus);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to override freeze");
      return false;
    }
  }

  return { status, loading, error, refresh, freeze, override };
}
