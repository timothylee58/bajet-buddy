"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GuestOnboardingFlow } from "@/components/features/onboarding/GuestOnboardingFlow";

export default function RootPage() {
  const router = useRouter();
  const { isGuest, enableGuestMode, guestData } = useGuestMode();

  useEffect(() => {
    if (!isGuest) {
      enableGuestMode();
    } else if (guestData.onboarding?.questions_answered) {
      router.replace("/dashboard");
    }
  }, [isGuest, guestData.onboarding?.questions_answered, enableGuestMode, router]);

  const handleOnboardingComplete = () => {
    router.replace("/dashboard");
  };

  if (!isGuest) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,92,255,0.16),_transparent_32rem),linear-gradient(180deg,_#fffefc,_#f8f4ff)]">
        <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-xl backdrop-blur">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-foreground">Preparing your budget world</span>
        </div>
      </div>
    );
  }

  if (guestData.onboarding?.questions_answered) {
    return null;
  }

  return <GuestOnboardingFlow onComplete={handleOnboardingComplete} />;
}
