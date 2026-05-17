"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground text-center">
      <p className="text-5xl mb-4">😵</p>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted mb-6 max-w-sm">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
      >
        Try again
      </button>
    </div>
  );
}
