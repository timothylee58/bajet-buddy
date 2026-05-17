"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "@/hooks/useGuestMode";

/**
 * Root page — auto-enables demo mode and redirects to dashboard.
 * No login required. Uses the demo Supabase user for all data.
 */
export default function RootPage() {
  const router = useRouter();
  const { isGuest, guestData, loading, enableGuestMode } = useGuestMode();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (done) return;

    if (!isGuest) {
      enableGuestMode();
    }

    // Wait one tick for state to settle, then redirect
    const t = setTimeout(() => {
      setDone(true);
      router.replace("/dashboard");
    }, 300);

    return () => clearTimeout(t);
  }, [isGuest, loading, enableGuestMode, router, done]);

  // Brief loading flash while redirecting
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}
