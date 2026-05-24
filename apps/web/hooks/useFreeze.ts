"use client";

import { useCallback, useEffect, useState } from "react";
import { getFreezeStatus, activateFreeze, overrideFreeze } from "@/lib/api";
import { useGuestMode } from "./useGuestMode";
import { useToast } from "@/components/ui/ToastProvider";
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

  const { isGuest, guestData, updateGuestData } = useGuestMode();
  const { success: toastSuccess, error: toastError } = useToast();

  const refresh = useCallback(async () => {
    if (isGuest) {
      const activeEvent = guestData.freeze_events?.[0]; // simple logic for now
      if (activeEvent) {
        setStatus({
          active: true,
          type: (activeEvent.type as "soft" | "hard") || "soft",
          reason: (activeEvent.reason as "auto" | "manual" | "buddy") || "manual",
          message: (activeEvent.note as string) || "Frozen by guest mode.",
          can_override: true,
          override_cost_xp: 50,
        });
      } else {
        setStatus(DEFAULT_STATUS);
      }
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await getFreezeStatus();
      setStatus(data as FreezeStatus);
    } catch (err) {
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
    if (isGuest) {
      setError("Sign in to activate spending freeze");
      return;
    }
    try {
      const updated = await activateFreeze(type);
      setStatus(updated as FreezeStatus);
      toastSuccess(`${type === "hard" ? "Hard" : "Soft"} freeze activated — spending locked`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to activate freeze";
      setError(msg);
      toastError(msg, "FREEZE_FAILED");
    }
  }

  async function override() {
    setError(null);
    if (isGuest) {
      setError("Sign in to override spending freeze");
      return false;
    }
    try {
      const updated = await overrideFreeze();
      setStatus(updated as FreezeStatus);
      toastSuccess("Freeze overridden — spending unlocked");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to override freeze";
      setError(msg);
      toastError(msg, "OVERRIDE_FAILED");
      return false;
    }
  }

  return { status, loading, error, refresh, freeze, override };
}