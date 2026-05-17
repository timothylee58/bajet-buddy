"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  errorCode?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant, opts?: { errorCode?: string; durationMs?: number }) => void;
  success: (message: string) => void;
  error: (message: string, errorCode?: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ───────────────────────────────────────────────────────────────

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", opts?: { errorCode?: string; durationMs?: number }) => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const duration = opts?.durationMs ?? (variant === "error" ? 6000 : 3500);

      const newToast: Toast = {
        id,
        message,
        variant,
        errorCode: opts?.errorCode,
        durationMs: duration,
      };

      setToasts((prev) => [...prev, newToast]);

      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const error = useCallback((message: string, errorCode?: string) => addToast(message, "error", { errorCode }), [addToast]);
  const info = useCallback((message: string) => addToast(message, "info"), [addToast]);
  const warning = useCallback((message: string) => addToast(message, "warning"), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, info, warning, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}
