"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FOMONegotiatorModal } from "@/components/features/fomo/FOMONegotiatorModal";
import type { FOMONegotiateRequest } from "@/types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Bajet Buddy",
  "/check": "Check Spend",
  "/profiles": "My Profile",
  "/freeze": "Account Freeze",
  "/onboarding": "Progressive Profiling",
  "/sentinel": "Inflasi Watchdog",
  "/income": "Income & Tax",
  "/budget": "Budget Settings",
  "/transactions": "Transactions",
  "/receipts": "Scan Receipt",
};

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "warning" | "success" | "info" | "fomo";
  fomoRequest?: FOMONegotiateRequest;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "fomo-1",
    title: "🧠 FOMO Alert — Shopee Flash Sale",
    body: "70% off dress ends in 2 hours. Your balance is RM340. Negotiate before you tap.",
    time: "Just now",
    read: false,
    type: "fomo",
    fomoRequest: {
      amount: 189,
      item_name: "Summer Dress",
      merchant: "Shopee Malaysia",
      category: "shopping",
      current_balance: 340,
      days_until_salary: 7,
      bnpl_load: 214,
    },
  },
  {
    id: "1",
    title: "Spending spike detected",
    body: "You've spent RM236 this Saturday — 28% above your weekend average.",
    time: "2h ago",
    read: false,
    type: "warning",
  },
  {
    id: "2",
    title: "BNPL due tomorrow",
    body: "Shopee PayLater RM89 is due on 18 May. Make sure your balance is ready.",
    time: "5h ago",
    read: false,
    type: "warning",
  },
  {
    id: "3",
    title: "+50 XP earned",
    body: "You scanned a receipt under your Food category average. Budget Warrior!",
    time: "1d ago",
    read: true,
    type: "success",
  },
  {
    id: "4",
    title: "Streak at risk",
    body: "Log a transaction today to keep your 6-day streak alive.",
    time: "1d ago",
    read: true,
    type: "info",
  },
];

const typeStyles: Record<Notification["type"], string> = {
  warning: "bg-tertiary-light border-tertiary/40 text-tertiary-dark",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  info:    "bg-surface-muted border-border text-neutral-dark",
  fomo:    "bg-primary-light border-primary/40 text-primary-dark",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] ?? "BajetBuddy";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [fomoRequest, setFomoRequest] = useState<FOMONegotiateRequest | null>(null);
  const [easterEggCount, setEasterEggCount] = useState(0);
  const easterEggTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleNotificationClick(n: Notification) {
    if (n.type === "fomo" && n.fomoRequest) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setOpen(false);
      setFomoRequest(n.fomoRequest);
    }
  }

  // Hidden easter egg: triple-click logo → replay onboarding
  function handleLogoClick() {
    const next = easterEggCount + 1;
    setEasterEggCount(next);
    if (easterEggTimer.current) clearTimeout(easterEggTimer.current);
    if (next >= 3) {
      setEasterEggCount(0);
      // Reset onboarding flag and navigate
      try {
        const guestData = localStorage.getItem("bb_guest_data");
        if (guestData) {
          const parsed = JSON.parse(guestData);
          parsed.onboarding = parsed.onboarding || {};
          parsed.onboarding.questions_answered = false;
          localStorage.setItem("bb_guest_data", JSON.stringify(parsed));
        }
        localStorage.setItem("bb_guest_mode", "true");
      } catch { /* ignore */ }
      router.push("/onboarding");
    } else {
      easterEggTimer.current = setTimeout(() => setEasterEggCount(0), 1500);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden bg-primary shadow-sm cursor-pointer select-none"
              onClick={handleLogoClick}
              title="Triple-click to replay onboarding"
            >
              <Image
                src="/logo.ico"
                alt="BajetBuddy logo"
                width={44}
                height={44}
                className="w-11 h-11 object-cover pointer-events-none"
                priority
              />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-fredoka)" }}>
                {title}
              </h1>
              <p className="text-xs text-muted">Your AI spending companion</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-neutral transition-colors hover:border-primary/30 hover:text-primary shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="fixed left-1/2 -translate-x-1/2 top-16 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-[1.75rem] border border-border bg-white shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <button type="button" onClick={markAllRead} className="text-xs font-semibold text-primary hover:text-primary-dark">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted">All caught up!</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`relative flex gap-3 px-4 py-3 ${!n.read ? "bg-primary-light/20" : ""} ${n.type === "fomo" ? "cursor-pointer hover:bg-primary-light/35" : ""}`}
                          >
                            <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                            <div className="min-w-0 flex-1">
                              <div className={`mb-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyles[n.type]}`}>
                                {n.type === "fomo" ? "FOMO alert" : n.type}
                              </div>
                              <p className="text-sm font-medium text-foreground">{n.title}</p>
                              <p className="mt-0.5 text-xs leading-5 text-neutral-dark">{n.body}</p>
                              {n.type === "fomo" && (
                                <p className="mt-1 text-[11px] font-semibold text-primary-dark">Tap to open Negotiator →</p>
                              )}
                              <p className="mt-1 text-[10px] text-muted">{n.time}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              className="shrink-0 text-neutral hover:text-foreground"
                              aria-label="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* FOMONegotiatorModal rendered OUTSIDE header to avoid stacking context issues */}
      <FOMONegotiatorModal
        open={fomoRequest !== null}
        request={fomoRequest}
        onClose={() => setFomoRequest(null)}
      />
    </>
  );
}
