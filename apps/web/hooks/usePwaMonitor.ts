"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPwaMonitorState, reportPwaAppOpened, clearPwaLockdown } from "@/lib/api";
import type { PwaMonitorState, PwaReportResponse } from "@/lib/api";

const SHOPEE_LAZADA_KEYWORDS = [
  "shopee",
  "lazada",
];

interface UsePwaMonitorReturn {
  monitor: PwaMonitorState | null;
  lockdown: PwaReportResponse | null;
  loading: boolean;
  checkNow: () => Promise<void>;
  dismissLockdown: () => Promise<void>;
}

/**
 * PWA BNPL Monitor Hook
 *
 * When the user picks BNPL in the FOMO Negotiator, a 24-hour monitor activates.
 * This hook polls the backend for monitor state and uses document visibility
 * changes to detect when the user switches to another app (Shopee/Lazada).
 *
 * In a real PWA, the service worker would intercept navigation events.
 * In this demo, we use document.visibilitychange + a heuristic check on
 * the current URL when the page becomes visible again.
 */
export function usePwaMonitor(): UsePwaMonitorReturn {
  const [monitor, setMonitor] = useState<PwaMonitorState | null>(null);
  const [lockdown, setLockdown] = useState<PwaReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const lastUrlRef = useRef<string>("");

  const checkNow = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getPwaMonitorState();
      setMonitor(state);
      if (state.lockdown_triggered) {
        setLockdown({
          lockdown: true,
          message: state.lockdown_message,
        });
      }
    } catch {
      setMonitor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial check on mount (deferred to avoid setState-in-effect)
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkNow();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [checkNow]);

  // Poll every 30 seconds for monitor state changes
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (monitor?.active) {
        void checkNow();
      }
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [monitor?.active, checkNow]);

  // Detect tab/app switches via visibility change
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        // We just came back to the app — check if we were on a shopping app
        const currentUrl = window.location.href.toLowerCase();
        const prevUrl = lastUrlRef.current.toLowerCase();

        // Heuristic: if the URL changed and contains shopee/lazada, report it
        if (prevUrl && prevUrl !== currentUrl) {
          const isShoppingDomain = SHOPEE_LAZADA_KEYWORDS.some(
            (kw) => prevUrl.includes(kw) || currentUrl.includes(kw)
          );
          if (isShoppingDomain && monitor?.active) {
            const domain = SHOPEE_LAZADA_KEYWORDS.find(
              (kw) => prevUrl.includes(kw) || currentUrl.includes(kw)
            ) ?? "shopee.com.my";
            reportPwaAppOpened(domain)
              .then((result) => {
                if (result.lockdown) {
                  setLockdown(result);
                  setMonitor((prev) => prev ? { ...prev, lockdown_triggered: true, lockdown_message: result.message } : prev);
                }
              })
              .catch(() => {});
          }
        }
        lastUrlRef.current = window.location.href;
      } else if (document.visibilityState === "hidden") {
        // User is switching away — record current URL
        lastUrlRef.current = window.location.href;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [monitor?.active]);

  const dismissLockdown = useCallback(async () => {
    try {
      await clearPwaLockdown();
      setLockdown(null);
      setMonitor((prev) => prev ? { ...prev, active: false, lockdown_triggered: false, lockdown_message: "" } : null);
    } catch {
      // ignore
    }
  }, []);

  return { monitor, lockdown, loading, checkNow, dismissLockdown };
}
