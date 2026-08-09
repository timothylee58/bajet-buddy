"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { getCreditScore, getLendingOffers, applyForLoan } from "@/lib/api";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { DataError } from "@/components/ui/DataError";
import { OfferCard } from "@/components/features/lending/OfferCard";
import { ApplicationStatus } from "@/components/features/lending/ApplicationStatus";
import { useToast } from "@/components/ui/ToastProvider";
import type { CreditScoreResponse, LoanApplication, LoanOffer } from "@/types";

const BAND_COLOR: Record<string, string> = {
  Poor: "text-danger",
  Fair: "text-primary",
  Good: "text-tertiary-dark",
  "Very Good": "text-tertiary-dark",
  Excellent: "text-tertiary-dark",
};

export default function LendingPage() {
  const [score, setScore] = useState<CreditScoreResponse | null>(null);
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const { success, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scoreRes, offersRes] = await Promise.all([getCreditScore(), getLendingOffers()]);
      setScore(scoreRes);
      setOffers(offersRes);
    } catch (err) {
      console.error("Failed to load lending data:", err);
      setError("Could not load lending offers. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApply(offerId: string) {
    setApplyingId(offerId);
    try {
      const result = await applyForLoan({ offer_id: offerId });
      setApplication(result);
      success("Application submitted");
    } catch (err) {
      console.error("Failed to apply for offer:", err);
      toastError("Could not submit application. Please try again.");
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted hover:text-foreground active-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Lending</h1>
          <p className="font-sans text-xs text-muted">
            Referred offers from partner institutions — BajetBuddy is not the lender
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-48" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!loading && error && <DataError message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-5">
          {score && !score.insufficient_history && score.band && (
            <section className="bg-white rounded-2xl border-b-4 border-border/30 p-5 chunky-shadow flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-tertiary-light flex items-center justify-center flex-shrink-0">
                <Landmark className="w-6 h-6 text-tertiary-dark" />
              </div>
              <div>
                <p className="font-sans text-xs text-muted uppercase">Your score band</p>
                <p className={`font-headline text-xl font-bold ${BAND_COLOR[score.band] ?? "text-foreground"}`}>
                  {score.band}
                </p>
              </div>
            </section>
          )}

          {score?.insufficient_history && (
            <div className="rounded-2xl bg-surface-muted p-5 text-center">
              <p className="font-sans text-sm text-muted">
                Keep using BajetBuddy for a bit longer — offers unlock once we have enough history to score you fairly.
              </p>
            </div>
          )}

          {application && <ApplicationStatus application={application} />}

          {!application && offers.length === 0 && !score?.insufficient_history && (
            <div className="rounded-2xl bg-surface-muted p-5 text-center">
              <p className="font-sans text-sm text-muted">No offers available right now — check back later.</p>
            </div>
          )}

          {!application &&
            offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onApply={handleApply}
                applying={applyingId === offer.id}
              />
            ))}
        </div>
      )}
    </div>
  );
}
