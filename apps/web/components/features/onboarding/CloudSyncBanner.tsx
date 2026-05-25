"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuestMode } from "@/hooks/useGuestMode";

export function CloudSyncBanner() {
  const { isGuest, guestData } = useGuestMode();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!sessionStorage.getItem("bb_sync_dismissed");
  });

  const isVisible = isGuest && guestData.xp >= 100 && !dismissed;

  const handleDismiss = () => {
    sessionStorage.setItem("bb_sync_dismissed", "true");
    setDismissed(true);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="px-4 py-2"
      >
        <Card className="bg-amber-50 border-amber-200 overflow-hidden relative">
          <div className="p-4 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle size={20} />
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                Progress at Risk!
              </h3>
              <p className="text-xs text-amber-800 leading-tight">
                You earned <span className="font-bold">{guestData.xp} XP</span> as a guest.
                If you clear your browser, your {guestData.persona?.name as string || "stats"} and {guestData.transactions.length} transactions will vanish forever.
              </p>

              <div className="pt-2 flex gap-3">
                <Button
                  size="sm"
                  disabled
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none text-[10px] h-8 opacity-50 cursor-not-allowed"
                >
                  <Cloud className="mr-1.5" size={14} />
                  Sync to Cloud (Coming Soon)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-amber-700 hover:bg-amber-100 text-[10px] h-8"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
