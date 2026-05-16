import { API_URL } from "./constants";
import type {
  CheckRequest,
  CheckResponse,
  FutureYouRequest,
  FutureYouResponse,
  GamificationStatus,
  ProgressiveProfilingSummary,
  ProfilingGoalType,
} from "@/types";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** POST /api/check — run the AI verdict pipeline */
export async function checkSpend(payload: CheckRequest): Promise<CheckResponse> {
  return apiFetch<CheckResponse>("/api/check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/budget/summary */
export async function getBudgetSummary() {
  return apiFetch("/api/budget/summary");
}

/** GET /api/transactions */
export async function getTransactions() {
  return apiFetch("/api/transactions");
}

/** GET /api/persona */
export async function getPersona() {
  return apiFetch("/api/persona");
}

/** POST /api/persona/analyze */
export async function analyzePersona(payload: unknown) {
  return apiFetch("/api/persona/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/simulations/future-you */
export async function simulateFutureYou(
  payload: FutureYouRequest
): Promise<FutureYouResponse> {
  return apiFetch<FutureYouResponse>("/api/simulations/future-you", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/buddies/leaderboard */
export async function getLeaderboard() {
  return apiFetch("/api/buddies/leaderboard");
}

/** GET /api/freeze/status */
export async function getFreezeStatus() {
  return apiFetch("/api/freeze/status");
}

/** POST /api/freeze/activate */
export async function activateFreeze(type: "soft" | "hard") {
  return apiFetch("/api/freeze/activate", {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

/** POST /api/freeze/override */
export async function overrideFreeze() {
  return apiFetch("/api/freeze/override", { method: "POST" });
}

/** GET /api/gamification/status */
export async function getGamificationStatus(): Promise<GamificationStatus> {
  return apiFetch<GamificationStatus>("/api/gamification/status");
}

/** GET /api/profiling/summary */
export async function getProfilingSummary(): Promise<ProgressiveProfilingSummary> {
  return apiFetch<ProgressiveProfilingSummary>("/api/profiling/summary");
}

/** POST /api/profiling/goals/activate */
export async function activateProfilingGoal(
  type: ProfilingGoalType,
  commitmentAmount: number
): Promise<ProgressiveProfilingSummary> {
  const response = await apiFetch<{ summary: ProgressiveProfilingSummary }>(
    "/api/profiling/goals/activate",
    {
      method: "POST",
      body: JSON.stringify({
        type,
        commitment_amount: commitmentAmount,
      }),
    }
  );
  return response.summary;
}
