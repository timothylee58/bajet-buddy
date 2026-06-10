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
  total_days?: number;
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
  bnpl?: boolean;
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
  real_hourly_rate?: number | null;
  life_hours_cost?: number | null;
}

// ─── Chat Check ───────────────────────────────────────────────────────────────
export interface ChatCheckRequest {
  message: string;
  language_preference?: "bm" | "en" | "manglish";
  tone_mode?: "professional" | "friendly" | "manglish" | "strict" | "encouraging";
  purchase_at?: string;
  bnpl?: boolean;
}

export interface ParsedSpendIntent {
  amount: number;
  category: string;
  merchant: string;
  item_name?: string | null;
  merchant_type: "essential" | "discretionary" | "mixed";
  essential: boolean;
  bnpl?: boolean;
  confidence: number;
  paraphrased: string;
}

export interface ChatMessage {
  role: "user" | "bajetbuddy";
  content: string;
}

export interface ChatCheckResponse {
  messages: ChatMessage[];
  result: CheckResponse;
  parsed_intent: ParsedSpendIntent;
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
  last_reroll_at?: string | null;
  next_reroll_at?: string | null;
  cooldown_days?: number | null;
}

export interface PersonaRerollResponse {
  status: "ok" | "cooldown" | "error";
  persona?: PersonaAnalysis | null;
  last_reroll_at?: string | null;
  next_reroll_at?: string | null;
  cooldown_days?: number | null;
  error?: string | null;
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

/** AI spending summary produced by DeepSeek after OCR extraction */
export interface OCRSpendingSummary {
  headline: string;
  insight: string;
  top_category: string;
  total_debits: number;
  total_credits: number;
  savings_tip: string;
}

export interface OCRScanResponse {
  status: "ok" | "error";
  scan_result: OCRScanResult | null;
  /** Manglish AI summary from DeepSeek — present when DEEPSEEK_API_KEY is set */
  spending_summary: OCRSpendingSummary | null;
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

// ─── FOMO Negotiator ──────────────────────────────────────────────────────────
export type PersonaCode = "pak_cik_audit" | "kak_therapist" | "meme_goblin" | "ice_cfo" | "hype_man";
export type EmotionalState = "stressed" | "bored" | "happy" | "yolo" | "lapar";

export interface FOMOPersona {
  code: PersonaCode;
  name: string;
  emoji: string;
  tagline: string;
  unlocked: boolean;
  unlock_condition: string;
}

export interface FOMONegotiateRequest {
  amount: number;
  item_name: string;
  merchant: string;
  category: string;
  current_balance?: number;
  days_until_salary?: number;
  bnpl_load?: number;
  emotional_state?: EmotionalState;
  persona_preference?: PersonaCode;
}

export interface FOMOOption {
  label: string;
  icon: string;
  impact_summary: string;
  warning: string;
  xp_delta: number;
  bounty_rm: number;
  recommended: boolean;
}

export interface FOMONegotiateResponse {
  persona: FOMOPersona;
  fomo_validation: string;
  trap_exposure: string;
  persona_quip: string;
  option_cash: FOMOOption;
  option_bnpl: FOMOOption;
  option_walk_away: FOMOOption;
  heat_level: number;
  walk_away_streak: number;
  bounty_jar_rm: number;
  heat_reasoning?: string;
  regret_probability?: number;
}

export type FOMOChoice = "cash" | "bnpl" | "walk_away";

export interface FOMOResolveRequest {
  choice: FOMOChoice;
  amount: number;
  category: string;
  emotional_state?: EmotionalState;
}

export interface FOMOResolveResponse {
  heat_level: number;
  heat_delta: number;
  walk_away_streak: number;
  bounty_jar_rm: number;
  bounty_earned_rm: number;
  xp_delta: number;
  loot_box_unlocked: boolean;
  message: string;
  persona_reaction: string;
  cooldown_until: string | null;
}

export interface FOMOState {
  heat_level: number;
  walk_away_streak: number;
  bounty_jar_rm: number;
  bounty_threshold_rm: number;
  unlocked_personas: PersonaCode[];
  cooldown_until: string | null;
}

// ─── Sentinel ─────────────────────────────────────────────────────────────────
export type SpendingCategory = "groceries" | "fuel" | "food_delivery" | "entertainment" | "transport" | "utilities";
export type RiskLabel = "Grocery-Sensitive" | "Fuel-Sensitive" | "Vulnerable Consumer" | "Food-Delivery Dependent" | "Entertainment Spender" | "Resilient Saver";
export type MacroEventType = "grain_spike" | "fuel_subsidy_cut" | "logistics_surge" | "currency_depreciation" | "electricity_tariff" | "palm_oil_shock";

export interface SpendingSnapshot {
  category: SpendingCategory;
  total_rm: number;
  pct_of_spend: number;
  transaction_count: number;
  top_merchant: string;
  sensitivity_score: number;
}

export interface RiskProfile {
  primary_label: RiskLabel;
  secondary_labels: RiskLabel[];
  vulnerability_score: number;
  most_exposed_category: SpendingCategory;
  top_risk_merchants: string[];
}

export interface MacroEvent {
  event_type: MacroEventType;
  title: string;
  title_bm: string;
  severity: number;
  description: string;
  icon: string;
  triggered_at: string;
}

export interface CategoryImpact {
  category: SpendingCategory;
  estimated_increase_rm: number;
  estimated_increase_pct: number;
  affected_merchants: string[];
}

export interface MacroImpactResult {
  event: MacroEvent;
  total_monthly_impact_rm: number;
  category_impacts: CategoryImpact[];
  ai_intervention_title: string;
  ai_intervention_bm: string;
  ai_intervention_body: string;
  persona_emoji: string;
  persona_name: string;
  severity_label: string;
}

export interface InflationQuest {
  id: string;
  title: string;
  title_bm: string;
  description: string;
  category: SpendingCategory;
  target_rm: number;
  current_rm: number;
  xp_reward: number;
  badge_name: string;
  badge_emoji: string;
  difficulty: "easy" | "medium" | "hard" | "legendary";
  active: boolean;
  completed: boolean;
  progress_pct: number;
}

export interface SentinelDashboardResponse {
  spending_snapshots: SpendingSnapshot[];
  risk_profile: RiskProfile;
  active_event: MacroEvent | null;
  quests: InflationQuest[];
  total_monthly_spend_rm: number;
  sentinel_heat: number;
  market_mood: string;
}

export interface SimulateEventRequest {
  event_type: MacroEventType;
}

export interface SimulateEventResponse {
  impact: MacroImpactResult;
  quests_generated: InflationQuest[];
  xp_awarded: number;
}

// ─── Pet Companion ────────────────────────────────────────────────────────────
export type PetSpecies = "raccoon" | "fox" | "squirrel" | "rabbit" | "finance_squirrel";
export type PetMood = "happy" | "worried" | "celebrating" | "sleepy" | "warning" | "neutral";
export type AccessorySlot = "hat" | "badge" | "trail" | "aura";

export interface PetProfile {
  user_id: string;
  species: PetSpecies;
  name: string;
  xp: number;
  level: number;
  mood: PetMood;
  accessories: string[];
  streak: number;
  total_saves_rm: number;
  walk_away_count: number;
}

export interface PetAccessory {
  id: string;
  name: string;
  emoji: string;
  slot: AccessorySlot;
  unlock_xp: number;
  description: string;
}

export interface PetNudge {
  message: string;
  mood: PetMood;
  trigger: string;
  xp_hint: number | null;
}

export interface AwardXPRequest {
  event: string;
  amount_rm?: number;
}

export interface AwardXPResponse {
  xp_earned: number;
  total_xp: number;
  level: number;
  level_up: boolean;
  new_accessory: PetAccessory | null;
}

export interface PetNudgeRequest {
  context: string;
  amount_rm?: number;
  category?: string;
}

export interface PetStatusResponse {
  profile: PetProfile;
  nudge: PetNudge;
  available_accessories: PetAccessory[];
  xp_to_next_level: number;
  progress_pct: number;
}

// ─── Sentinel Engine (frontend mock types) ────────────────────────────────────

export type RiskProfileType =
  | "grocery_sensitive"
  | "fuel_sensitive"
  | "delivery_sensitive"
  | "vulnerable_consumer"
  | "balanced";

export type QuestDifficulty = "critical" | "rising" | "calm";

export interface MockSentinelTransaction {
  id: string;
  merchant: string;
  categoryId: string;
  amount: number;
  date: string;
}

export interface MacroMarketEvent {
  id: string;
  kind: string;
  title: string;
  headlineBm: string;
  headlineEn: string;
  severity: number;
  affectedCategories: string[];
  weeklyImpactRm: number;
  difficulty: QuestDifficulty;
}

export interface SpendingCategorySummary {
  id: string;
  label: string;
  emoji: string;
  spent: number;
  budget: number;
  color: string;
  topMerchants: string[];
}

export interface SentinelBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

export interface TabungGoal {
  id: string;
  name: string;
  emoji: string;
  targetRm: number;
  savedRm: number;
  weeklyTopUpRm: number;
}

export interface InflationImpactCategory {
  categoryId: string;
  label: string;
  deltaRm: number;
}

export interface InflationImpact {
  weeklyRm: number;
  monthlyRm: number;
  categoryBreakdown: InflationImpactCategory[];
  pokaiRiskDelta: number;
}

export interface SurvivalQuest {
  id: string;
  title: string;
  description: string;
  targetCategoryId: string;
  spendCapRm: number;
  rewardXp: number;
  badgeId: string;
  badgeName: string;
  badgeEmoji: string;
  daysLeft: number;
  progressPct: number;
  active: boolean;
  completed: boolean;
}

export interface PokaiForecast {
  score: number;
  label: string;
  daysToPokai: number | null;
  messageBm: string;
  messageEn: string;
}
