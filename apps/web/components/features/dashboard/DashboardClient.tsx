"use client";

import nextDynamic from "next/dynamic";

const BehaviorDashboard = nextDynamic(
  () => import("./BehaviorDashboard").then((m) => m.BehaviorDashboard),
  { ssr: false }
);

export function DashboardClient() {
  return <BehaviorDashboard />;
}
