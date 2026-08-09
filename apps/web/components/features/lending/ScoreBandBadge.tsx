"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { getCreditScore } from "@/lib/api";
import type { CreditScoreResponse } from "@/types";

// Self-contained: fetches its own score so it can drop into the dashboard
// without threading lending state through BehaviorDashboard's existing
// data flow. Renders nothing while loading, on error, or with insufficient
// history — a missing badge is a fine failure mode for an optional stretch
// element, unlike the other dashboard cards which use the loading/error
// skeleton pattern.
export function ScoreBandBadge() {
  const [score, setScore] = useState<CreditScoreResponse | null>(null);

  useEffect(() => {
    let active = true;
    getCreditScore()
      .then((data) => {
        if (active) setScore(data);
      })
      .catch(() => {
        // silent — this is a non-critical dashboard accent, not a fetch the
        // page should show an error state for
      });
    return () => {
      active = false;
    };
  }, []);

  if (!score || score.insufficient_history || !score.band) return null;

  return (
    <Link href="/lending" className="block mb-4">
      <div className="flex items-center gap-2 bg-tertiary-light border border-tertiary/20 rounded-xl px-4 py-2 active-press">
        <Landmark className="w-4 h-4 text-tertiary-dark flex-shrink-0" />
        <span className="font-sans text-xs text-tertiary-dark">
          Your score band: <span className="font-bold">{score.band}</span> — see lending offers
        </span>
      </div>
    </Link>
  );
}
