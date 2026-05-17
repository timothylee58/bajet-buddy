"use client";

import { useState } from "react";
import { Bell, X, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FOMONegotiatorModal } from "@/components/features/fomo/FOMONegotiatorModal";
import type { FOMONegotiateRequest } from "@/types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Bajet Buddy",
  "/check": "Check Spend",
  "/persona": "My Persona",
  "/buddies": "Buddies",
  "/freeze": "Account Freeze",
  "/onboarding": "Progressive Profiling",
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

const typeStyles = {
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  info: "bg-zinc-50 border-zinc-200 text-zinc-600",
  fomo: "bg-violet-50 border-violet-200 text-violet-700",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "BajetBuddy";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [fomoRequest, setFomoRequest] = useState<FOMONegotiateRequest | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleNotificationClick(n: Notification) {
    if (n.type === "fomo" && n.fomoRequest) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setOpen(false);
      setFomoRequest(n.fomoRequest);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/5 bg-zinc-50/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-950">{title}</h1>
            <p className="text-xs text-zinc-500">
              Your AI spending companion
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:text-zinc-950"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                    <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-50">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-zinc-400">
                        All caught up!
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`relative flex gap-3 px-4 py-3 ${!n.read ? "bg-zinc-50/70" : ""} ${n.type === "fomo" ? "cursor-pointer hover:bg-violet-50/50" : ""}`}
                        >
                          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-emerald-500" : "bg-transparent"}`} />
                          <div className="min-w-0 flex-1">
                            <div className={`mb-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyles[n.type]}`}>
                              {n.type === "fomo" ? "FOMO alert" : n.type}
                            </div>
                            <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                            <p className="mt-0.5 text-xs leading-5 text-zinc-500">{n.body}</p>
                            {n.type === "fomo" && (
                              <p className="mt-1 text-[11px] font-semibold text-violet-600">Tap to open Negotiator →</p>
                            )}
                            <p className="mt-1 text-[10px] text-zinc-400">{n.time}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                            className="shrink-0 text-zinc-300 hover:text-zinc-500"
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

      <FOMONegotiatorModal
        open={fomoRequest !== null}
        request={fomoRequest}
        onClose={() => setFomoRequest(null)}
      />
    </header>
  );
}
