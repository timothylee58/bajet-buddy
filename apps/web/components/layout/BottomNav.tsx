"use client";

import { BrainCircuit, House, Sparkles, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",    icon: House },
  { href: "/check",     label: "Guard",   icon: ShieldCheck },
  { href: "/simulator", label: "Future",  icon: Sparkles },
  { href: "/persona",   label: "Persona", icon: BrainCircuit },
  { href: "/buddies",   label: "Circle",  icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 pb-safe backdrop-blur"
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
                  "flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-neutral hover:text-foreground hover:bg-neutral-light"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg transition-colors",
                    active && "bg-primary text-white"
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className={cn("text-[10px] font-semibold", active ? "text-primary" : "text-neutral")}>
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
