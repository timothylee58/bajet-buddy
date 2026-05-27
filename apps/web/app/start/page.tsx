"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GuestOnboardingFlow } from "@/components/features/onboarding/GuestOnboardingFlow";

const BG = "bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_28rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)]";

export default function StartPage() {
  const router = useRouter();
  const { isGuest, enableGuestMode } = useGuestMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isGuest) {
      enableGuestMode();
    }
  }, [mounted, isGuest, enableGuestMode]);

  if (!mounted || !isGuest) {
    return (
      <div className={`flex min-h-[100dvh] items-center justify-center ${BG}`}>
        <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-xl backdrop-blur">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-foreground">Preparing your budget world</span>
        </div>
      </div>
    );
  }

  return <GuestOnboardingFlow onComplete={() => router.replace("/dashboard")} />;
}
