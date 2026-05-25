"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GuestOnboardingFlow } from "@/components/features/onboarding/GuestOnboardingFlow";

/**
 * Root page — auto-enables demo mode, then shows onboarding.
 * Onboarding collects 5 Q&A answers → Agent 1 persona → bank statement upload.
 * After onboarding complete, user is redirected to dashboard.
 */
export default function RootPage() {
  const router = useRouter();
  const { isGuest, loading, enableGuestMode, guestData } = useGuestMode();
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isGuest) {
      enableGuestMode();
      return;
    }
    // Determine if onboarding is needed
    const onboardingDone = guestData.onboarding?.questions_answered;
    if (onboardingDone) {
      router.replace("/dashboard");
    } else {
      setShowOnboarding(true);
      setReady(true);
    }
  }, [isGuest, loading]);

  const handleOnboardingComplete = () => {
    router.replace("/dashboard");
  };

  if (!ready && !showOnboarding) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,92,255,0.16),_transparent_32rem),linear-gradient(180deg,_#fffefc,_#f8f4ff)]">
        <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-xl backdrop-blur">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-foreground">Preparing your budget world</span>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <GuestOnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return null;
}
