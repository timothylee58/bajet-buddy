"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function DataError({ message, onRetry, className, compact = false }: DataErrorProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2", className)}>
        <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
        <p className="flex-1 text-xs text-muted">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-danger/10 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center", className)}>
      <AlertCircle className="h-6 w-6 text-danger" />
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
