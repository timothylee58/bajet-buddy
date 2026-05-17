// ─── Verdict ──────────────────────────────────────────────────────────────────
export type Verdict = "boleh" | "fikir_dulu" | "jangan_dulu";

// ─── User / Profile ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  monthly_income: number;
  created_at: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export interface BudgetSummary {
  total_income: number;
  total_spent: number;
  remaining: number;
  days_left: number;
  daily_safe_amount: number;
}

export interface CategoryBudget {
  id: string;
  name: string;
  emoji: string;
  allocated: number;
  spent: number;
  color: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  merchant: string;
  note?: string;
  verdict: Verdict;
  created_at: string;
}

// ─── Check Request / Response ─────────────────────────────────────────────────
export interface CheckRequest {
  amount: number;
  category: string;
  merchant: string;
  merchant_type?: "essential" | "discretionary" | "mixed";
  item_name?: string;
  essential?: boolean;
  language_preference?: "bm" | "en" | "manglish";
  tone_mode?: "professional" | "friendly" | "manglish" | "strict" | "encouraging";
  purchase_at?: string;
}

export interface CheckResponse {
  verdict: Verdict;
  nudge_bm: string;
  nudge_en: string;
  risk_score: number;
  budget_impact_pct: number;
  xp_earned: number;
  reason_codes?: string[];
  recommended_action?: string;
  explanation?: string;
  tradeoff?: string;
  alternative_action?: string;
  cta_buttons?: string[];
  projected_remaining_balance?: number | null;
  projected_daily_survival_amount?: number | null;
  proactive_alert?: boolean;
  proactive_trigger_reason?: string | null;
  persona?: {
    type: string;
    name: string;
    emoji: string;
    description: string;
    confidence: number;
  } | null;
  freeze_status?: FreezeStatus | null;
  pipeline_trace?: string[];
}

// ─── BNPL ─────────────────────────────────────────────────────────────────────
export interface BNPLItem {
  id: string;
  provider: string;
  total_amount: number;
  monthly_payment: number;
  months_remaining: number;
  risk_weight: number;
}

// ─── Persona ──────────────────────────────────────────────────────────────────
export type PersonaType =
  | "midnight_shopee_queen"
  | "gaji_habis_king"
  | "bubble_tea_bro"
  | "mamak_lepak_spender"
  | "bnpl_roller"
  | "grabfood_spiral"
  | "bonus_burner"
  | "future_homeowner"
  | "savings_starter";

export interface Persona {
  type: PersonaType;
  name: string;
  emoji: string;
  description: string;
  level: number;
  xp: number;
  xp_to_next: number;
  streak: number;
}

export interface PersonaAnalysis extends Persona {
  explanation: string;
  suggested_intervention_rule: string;
  confidence: number;
  top_signals: string[];
}

export interface FutureTimelinePoint {
  month: string;
  cashflow_end_balance: number;
  savings_balance: number;
  emergency_fund_balance: number;
  bnpl_remaining: number;
}

export interface FutureScenario {
  id: string;
  title: string;
  description: string;
  six_month_cashflow: FutureTimelinePoint[];
  bnpl_burden: number;
  emergency_fund_impact: number;
  savings_impact: number;
  stress_score: number;
  recommendation: string;
}

export interface FutureYouRequest {
  question: string;
  purchase_amount: number;
  purchase_name: string;
  monthly_income: number;
  current_balance: number;
  monthly_expenses: number;
  monthly_savings_contribution: number;
  emergency_fund: number;
  bnpl_monthly_payment: number;
  bnpl_months: number;
}

export interface FutureYouResponse {
  verdict: string;
  summary: string;
  recommended_scenario_id: string;
  scenarios: FutureScenario[];
}

// ─── Achievement ──────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  unlocked_at?: string;
}

// ─── Buddy / Leaderboard ──────────────────────────────────────────────────────
export interface BuddyEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  xp: number;
  streak: number;
  is_me: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  days_left: number;
  joined: boolean;
  reward_xp: number;
}

// ─── Freeze ───────────────────────────────────────────────────────────────────
export type FreezeType = "soft" | "hard";
export type FreezeReason = "auto" | "manual" | "buddy";

export interface FreezeStatus {
  active: boolean;
  type: FreezeType;
  reason: FreezeReason;
  message: string;
  can_override: boolean;
  override_cost_xp: number;
  activated_at?: string;
}

export interface GamificationStatus {
  xp: number;
  streak: number;
  level: number;
  level_name: string;
  level_min_xp: number;
  xp_to_next: number;
  progress_pct: number;
  last_active_date?: string | null;
}

export type ProfilingLayerStatus = "available" | "active" | "locked" | "complete";
export type ProfilingGoalType =
  | "emergency_fund"
  | "debt_reduction"
  | "home_savings"
  | "no_spend";
export type ProfilingAgentStatus = "locked" | "ready" | "unlocked";

export interface ProfilingLayer {
  id: string;
  title: string;
  status: ProfilingLayerStatus;
  description: string;
  value_unlocked: string;
  signals: string[];
  cta: string;
}

export interface ProfilingGoal {
  type: ProfilingGoalType;
  label: string;
  commitment_label: string;
  started: boolean;
  progress_label: string;
}

export interface UnlockableAgent {
  code: string;
  label: string;
  status: ProfilingAgentStatus;
  description: string;
  unlock_rule: string;
  progress_label: string;
}

// ─── OCR (Agent 4: Receipt Scanner) ──────────────────────────────────────────
export interface OCRTransaction {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  transaction_type: "debit" | "credit";
}

export interface OCRScanResult {
  document_type: "receipt" | "bank_statement";
  store_name: string;
  total_amount: number;
  line_items: OCRTransaction[];
  transactions: OCRTransaction[];
  raw_text: string;
}

export interface OCRInsertResult {
  transaction_id: string | null;
  merchant: string;
  amount: number;
  db_inserted: boolean;
  db_error: string | null;
}

export interface OCRScanResponse {
  status: "ok" | "error";
  scan_result: OCRScanResult | null;
  insert_results: OCRInsertResult[];
  total_inserted: number;
  total_failed: number;
  xp_earned: number;
  processing_time_ms: number;
  error: string | null;
}

// ─── Progressive Profiling ───────────────────────────────────────────────────
export interface ProgressiveProfilingSummary {
  profile_score: number;
  principle: string;
  next_best_action: string;
  layers: ProfilingLayer[];
  goals: ProfilingGoal[];
  unlockable_agents: UnlockableAgent[];
  xp: number;
  streak: number;
  days_observed: number;
}
