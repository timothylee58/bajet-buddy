"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInsurancePolicies } from "@/lib/api";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { DataError } from "@/components/ui/DataError";
import { PolicyCard } from "@/components/features/insurance/PolicyCard";
import type { InsurancePolicy } from "@/types";

export default function InsurancePage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsurancePolicies();
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load insurance policies:", err);
      setError("Could not load your coverage. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted hover:text-foreground active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Coverage</h1>
          <p className="font-sans text-xs text-muted">
            Referred policies from partner institutions — BajetBuddy is not the insurer
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard className="h-32" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!loading && error && <DataError message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-4">
          {policies.length === 0 && (
            <div className="rounded-2xl bg-surface-muted p-5 text-center">
              <p className="font-sans text-sm text-muted">
                No coverage yet — nudges appear on your Check screen when a purchase or your BNPL balance qualifies.
              </p>
            </div>
          )}
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
