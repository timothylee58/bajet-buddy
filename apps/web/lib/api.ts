import { API_URL } from "./constants";
import type {
  CheckRequest,
  CheckResponse,
  FOMONegotiateRequest,
  FOMONegotiateResponse,
  FOMOResolveRequest,
  FOMOResolveResponse,
  FOMOState,
  FutureYouRequest,
  FutureYouResponse,
  GamificationStatus,
  InflationQuest,
  MacroEventType,
  ProgressiveProfilingSummary,
  ProfilingGoalType,
  SentinelDashboardResponse,
  SimulateEventResponse,
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

/** POST /api/fomo/negotiate */
export async function fomoNegotiate(payload: FOMONegotiateRequest): Promise<FOMONegotiateResponse> {
  return apiFetch<FOMONegotiateResponse>("/api/fomo/negotiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/fomo/resolve */
export async function fomoResolve(payload: FOMOResolveRequest): Promise<FOMOResolveResponse> {
  return apiFetch<FOMOResolveResponse>("/api/fomo/resolve", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/fomo/state */
export async function getFOMOState(): Promise<FOMOState> {
  return apiFetch<FOMOState>("/api/fomo/state");
}

/** GET /api/sentinel/dashboard */
export async function getSentinelDashboard(): Promise<SentinelDashboardResponse> {
  return apiFetch<SentinelDashboardResponse>("/api/sentinel/dashboard");
}

/** POST /api/sentinel/simulate-event */
export async function simulateMacroEvent(event_type: MacroEventType): Promise<SimulateEventResponse> {
  return apiFetch<SimulateEventResponse>("/api/sentinel/simulate-event", {
    method: "POST",
    body: JSON.stringify({ event_type }),
  });
}

/** GET /api/sentinel/quests */
export async function getSentinelQuests(): Promise<InflationQuest[]> {
  return apiFetch<InflationQuest[]>("/api/sentinel/quests");
}

/** POST /api/sentinel/quests/{quest_id}/complete */
export async function completeSentinelQuest(questId: string): Promise<{ xp_awarded: number; message: string }> {
  return apiFetch<{ xp_awarded: number; message: string }>(
    `/api/sentinel/quests/${questId}/complete`,
    { method: "POST" }
  );
}
