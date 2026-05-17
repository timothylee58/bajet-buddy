"use client";

import { Home, Zap, PlusCircle, Medal, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",    icon: Home,    isMain: false },
  { href: "/streak",    label: "Streak",  icon: Zap,     isMain: false },
  { href: "/check",     label: "Check",   icon: PlusCircle, isMain: true },
  { href: "/badges",    label: "Badges",  icon: Medal,   isMain: false },
  { href: "/profiles",  label: "Profile", icon: User,    isMain: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)] rounded-t-[32px]"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, isMain }) => {
        const active = pathname === href || pathname.startsWith(href + "/");

        if (isMain) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center bg-primary text-white rounded-2xl w-[80px] h-[72px] -mt-8 shadow-[0_4px_12px_rgba(186,98,0,0.4)] active-press"
            >
              <Icon className="w-[28px] h-[28px] mb-1" />
              <span className="font-sans text-[14px] font-bold">{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center",
              active ? "text-primary" : "text-[#5c5c5c] hover:text-foreground"
            )}
          >
            <Icon className="w-[24px] h-[24px] mb-1" />
            <span className="font-sans text-[12px] font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
