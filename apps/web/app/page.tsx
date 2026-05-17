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
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (guestData.onboarding?.questions_answered) {
    return null;
  }

  return <GuestOnboardingFlow onComplete={handleOnboardingComplete} />;
}
