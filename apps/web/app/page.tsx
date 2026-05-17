"use client";

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (showOnboarding) {
    return <GuestOnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return null;
}
