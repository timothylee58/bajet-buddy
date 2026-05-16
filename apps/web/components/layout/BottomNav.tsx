"use client";

import {
  BrainCircuit,
  House,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/check", label: "Guard", icon: ShieldCheck },
  { href: "/simulator", label: "Future", icon: Sparkles },
  { href: "/persona", label: "Persona", icon: BrainCircuit },
  { href: "/buddies", label: "Circle", icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-900/5 bg-white/95 pb-safe backdrop-blur"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex w-full max-w-7xl items-center justify-around px-2 pt-2 pb-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-400 hover:text-zinc-700"
                )}
              >
                <span className="leading-none" aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-emerald-700" : "text-zinc-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
