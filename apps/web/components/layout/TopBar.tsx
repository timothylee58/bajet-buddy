"use client";

import { BellDot, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Belanja Guard",
  "/check": "Check Spend",
  "/persona": "My Persona",
  "/buddies": "Buddies",
  "/freeze": "Account Freeze",
  "/onboarding": "Progressive Profiling",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "BajetBuddy";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/5 bg-zinc-50/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-950">{title}</h1>
            <p className="text-xs text-zinc-500">
              Behavioural finance intervention engine
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:text-zinc-950"
          aria-label="Notifications"
        >
          <BellDot className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
