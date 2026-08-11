"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRecurring } from "@/hooks/useRecurring";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { DataError } from "@/components/ui/DataError";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { RecurringTotals } from "@/components/features/recurring/RecurringTotals";
import { SubscriptionCard } from "@/components/features/recurring/SubscriptionCard";

export default function RecurringPage() {
  const { data, loading, error, refetch } = useRecurring();

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted hover:text-foreground active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Langganan Radar</h1>
          <p className="font-sans text-xs text-muted">
            Charges that keep coming back, spotted from your own transactions
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-36" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!loading && error && <DataError message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <ErrorBoundary>
          <div className="space-y-5">
            <RecurringTotals summary={data} />

            {data.subscriptions.length === 0 ? (
              <div className="rounded-2xl bg-surface-muted p-5 text-center">
                <p className="font-sans text-sm text-muted">
                  No recurring charges yet. We need at least three charges from the same merchant
                  before we can call it a subscription.
                </p>
              </div>
            ) : (
              data.subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={`${subscription.merchant}-${subscription.cadence}`}
                  subscription={subscription}
                />
              ))
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
