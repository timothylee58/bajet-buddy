import { API_URL } from "./constants";
import { createClient } from "./supabase/client";
import type {
  AwardXPRequest,
  AwardXPResponse,
  ChatCheckRequest,
  ChatCheckResponse,
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
  OCRScanResponse,
  InflationQuest,
  MacroEventType,
  PetNudge,
  PetNudgeRequest,
  PetProfile,
  PetSpecies,
  PetStatusResponse,
  ProgressiveProfilingSummary,
  ProfilingGoalType,
  SentinelDashboardResponse,
  SimulateEventResponse,
} from "@/types";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // non-auth environments (demo mode) — proceed without token
  }
  return {};
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** POST /api/check */
export async function checkSpend(payload: CheckRequest): Promise<CheckResponse> {
  return apiFetch<CheckResponse>("/api/check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/check/chat — natural language pre-purchase check */
export async function chatCheckSpend(payload: ChatCheckRequest): Promise<ChatCheckResponse> {
  return apiFetch<ChatCheckResponse>("/api/check/chat", {
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
export async function simulateFutureYou(payload: FutureYouRequest): Promise<FutureYouResponse> {
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
      body: JSON.stringify({ type, commitment_amount: commitmentAmount }),
    }
  );
  return response.summary;
}

/** POST /api/ocr/scan — Agent 4: Receipt Scanner */
export async function scanReceipt(imageBase64: string): Promise<OCRScanResponse> {
  return apiFetch<OCRScanResponse>("/api/ocr/scan", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
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

// ─── Pet Companion ────────────────────────────────────────────────────────────

/** GET /api/pet/profile */
export async function getPetProfile(): Promise<PetProfile> {
  return apiFetch<PetProfile>("/api/pet/profile");
}

/** POST /api/pet/select */
export async function selectPetSpecies(species: PetSpecies): Promise<PetProfile> {
  return apiFetch<PetProfile>("/api/pet/select", {
    method: "POST",
    body: JSON.stringify({ species }),
  });
}

/** POST /api/pet/award-xp */
export async function awardPetXP(payload: AwardXPRequest): Promise<AwardXPResponse> {
  return apiFetch<AwardXPResponse>("/api/pet/award-xp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/pet/nudge */
export async function getPetNudge(payload: PetNudgeRequest): Promise<PetNudge> {
  return apiFetch<PetNudge>("/api/pet/nudge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/pet/status */
export async function getPetStatus(
  context: string,
  amount_rm?: number,
  category?: string
): Promise<PetStatusResponse> {
  const params = new URLSearchParams({ context });
  if (amount_rm !== undefined) params.set("amount_rm", String(amount_rm));
  if (category) params.set("category", category);
  return apiFetch<PetStatusResponse>(`/api/pet/status?${params.toString()}`);
}
