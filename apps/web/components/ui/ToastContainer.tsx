"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./ToastProvider";
import type { ToastVariant } from "./ToastProvider";

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-300",
    icon: XCircle,
    iconColor: "text-red-600",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: Info,
    iconColor: "text-blue-600",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-28 left-0 right-0 z-[90] pointer-events-none flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 w-full max-w-md rounded-2xl border-2 px-4 py-3 shadow-lg",
                style.bg,
                style.border
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 leading-5">{toast.message}</p>
                {toast.errorCode && (
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                    Code: {toast.errorCode}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-full p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-black/5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
