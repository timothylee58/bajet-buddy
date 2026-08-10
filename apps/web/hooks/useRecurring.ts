"use client";

import { useCallback, useEffect, useState } from "react";
import { getRecurringSummary } from "@/lib/api";
import type { RecurringSummary } from "@/types";

export function useRecurring() {
  const [data, setData] = useState<RecurringSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getRecurringSummary());
    } catch (err) {
      console.error("Failed to load recurring subscriptions:", err);
      setError("Could not load your subscriptions. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
