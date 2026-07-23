"use client";

import { Home, ShieldAlert, PlusCircle, Medal, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home",     icon: Home,        isMain: false },
  { href: "/sentinel",  label: "Watchdog", icon: ShieldAlert, isMain: false },
  { href: "/check",     label: "Check",    icon: PlusCircle,  isMain: true },
  { href: "/badges",    label: "Badges",   icon: Medal,       isMain: false },
  { href: "/profiles",  label: "Profile",  icon: User,        isMain: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center px-4 py-3 pb-safe bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-t border-white/40 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] rounded-t-[32px]"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, isMain }) => {
        const active = pathname === href || pathname.startsWith(href + "/");

        if (isMain) {
          return (
            <Link key={href} href={href} className="relative -mt-8 block">
              <motion.div
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex flex-col items-center justify-center bg-primary text-white rounded-2xl w-[80px] h-[72px] shadow-[0_4px_12px_rgba(186,98,0,0.4)] ring-4 ring-white/50"
              >
                <Icon className="w-[28px] h-[28px] mb-1" />
                <span className="font-sans text-[14px] font-bold">{label}</span>
              </motion.div>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-col items-center justify-center px-3 py-1.5"
          >
            {active && (
              <motion.div
                layoutId="bottom-nav-active-pill"
                className="absolute inset-0 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center",
                active ? "text-primary" : "text-[#5c5c5c] hover:text-foreground"
              )}
            >
              <Icon className="w-[24px] h-[24px] mb-1" />
              <span className="font-sans text-[12px] font-bold">{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
