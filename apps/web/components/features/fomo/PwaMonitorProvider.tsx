"use client";

import { usePwaMonitor } from "@/hooks/usePwaMonitor";
import { PwaLockdownOverlay } from "@/components/features/fomo/PwaLockdownOverlay";

/**
 * Global PWA monitor wrapper.
 * Mounted in the app layout, it polls for BNPL monitor state
 * and shows the lockdown overlay when triggered.
 */
export function PwaMonitorProvider({ children }: { children: React.ReactNode }) {
  const { lockdown, dismissLockdown } = usePwaMonitor();

  return (
    <>
      {children}
      <PwaLockdownOverlay lockdown={lockdown} onDismiss={dismissLockdown} />
    </>
  );
}
