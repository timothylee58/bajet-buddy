"use client";

import nextDynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const BehaviorDashboard = nextDynamic(
  () => import("./BehaviorDashboard").then((m) => m.BehaviorDashboard),
  { ssr: false }
);

export function DashboardClient() {
  return (
    <ErrorBoundary>
      <BehaviorDashboard />
    </ErrorBoundary>
  );
}
