import type {
  MacroMarketEvent,
  MockSentinelTransaction,
  SentinelBadge,
  SpendingCategorySummary,
  TabungGoal,
} from "@bajetbuddy/shared";

export const DEMO_USER = {
  name: "Ahmad",
  persona: "mamak_bro" as const,
  personaLabel: "Mamak Bro",
  emoji: "🧋",
  monthlyIncome: 3200,
  balance: 486,
  daysToSalary: 13,
};

export const MOCK_TRANSACTIONS: MockSentinelTransaction[] = [
  { id: "t1", merchant: "Mydin", categoryId: "groceries", amount: 142.5, date: "2026-05-14" },
  { id: "t2", merchant: "Lotus's", categoryId: "groceries", amount: 89.2, date: "2026-05-13" },
  { id: "t3", merchant: "NSK Grocer", categoryId: "groceries", amount: 56.8, date: "2026-05-11" },
  { id: "t4", merchant: "Petronas", categoryId: "fuel", amount: 80, date: "2026-05-14" },
  { id: "t5", merchant: "Shell", categoryId: "fuel", amount: 75, date: "2026-05-10" },
  { id: "t6", merchant: "BHPetrol", categoryId: "fuel", amount: 70, date: "2026-05-07" },
  { id: "t7", merchant: "GrabFood", categoryId: "food_delivery", amount: 28.5, date: "2026-05-14" },
  { id: "t8", merchant: "foodpanda", categoryId: "food_delivery", amount: 32, date: "2026-05-12" },
  { id: "t9", merchant: "GrabFood", categoryId: "food_delivery", amount: 24, date: "2026-05-09" },
  { id: "t10", merchant: "TGV", categoryId: "entertainment", amount: 42, date: "2026-05-08" },
  { id: "t11", merchant: "Steam", categoryId: "entertainment", amount: 35, date: "2026-05-05" },
  { id: "t12", merchant: "Aeon Big", categoryId: "groceries", amount: 67.3, date: "2026-05-06" },
];

export const CATEGORY_SUMMARIES: SpendingCategorySummary[] = [
  {
    id: "groceries",
    label: "Groceries",
    emoji: "🛒",
    spent: 356,
    budget: 420,
    color: "#BA6200",
    topMerchants: ["Mydin", "Lotus's", "NSK"],
  },
  {
    id: "fuel",
    label: "Fuel",
    emoji: "⛽",
    spent: 225,
    budget: 280,
    color: "#d97706",
    topMerchants: ["Petronas", "Shell", "BHPetrol"],
  },
  {
    id: "food_delivery",
    label: "Food delivery",
    emoji: "🍜",
    spent: 84.5,
    budget: 120,
    color: "#944E00",
    topMerchants: ["GrabFood", "foodpanda"],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    emoji: "🎮",
    spent: 77,
    budget: 100,
    color: "#F59E0B",
    topMerchants: ["TGV", "Steam"],
  },
];

export const MACRO_EVENTS: MacroMarketEvent[] = [
  {
    id: "grain_spike",
    kind: "grain_spike",
    title: "Global grain price spike",
    headlineBm: "Harga bijirin global naik mendadak",
    headlineEn: "Global grain costs just spiked",
    severity: 72,
    affectedCategories: ["groceries"],
    weeklyImpactRm: 18,
    difficulty: "rising",
  },
  {
    id: "logistics_surge",
    kind: "logistics_surge",
    title: "Logistics cost surge",
    headlineBm: "Kos logistik naik — barang runcit ikut mahal",
    headlineEn: "Logistics costs are climbing",
    severity: 58,
    affectedCategories: ["groceries", "food_delivery"],
    weeklyImpactRm: 14,
    difficulty: "rising",
  },
  {
    id: "fuel_subsidy_cut",
    kind: "fuel_subsidy_cut",
    title: "Fuel subsidy adjustment",
    headlineBm: "Subsidi petrol diselaraskan — RON95 ikut naik",
    headlineEn: "Fuel subsidy adjustment announced",
    severity: 85,
    affectedCategories: ["fuel", "food_delivery"],
    weeklyImpactRm: 32,
    difficulty: "critical",
  },
  {
    id: "palm_oil_export",
    kind: "palm_oil_export",
    title: "Palm oil export levy",
    headlineBm: "Levi eksport minyak sawit — minyak masak naik",
    headlineEn: "Cooking oil prices under pressure",
    severity: 45,
    affectedCategories: ["groceries"],
    weeklyImpactRm: 9,
    difficulty: "calm",
  },
  {
    id: "ringgit_weakness",
    kind: "ringgit_weakness",
    title: "Ringgit weakness",
    headlineBm: "Ringgit lemah — import jadi mahal",
    headlineEn: "Ringgit slide hits imported goods",
    severity: 65,
    affectedCategories: ["groceries", "entertainment"],
    weeklyImpactRm: 22,
    difficulty: "rising",
  },
];

export const INITIAL_BADGES: SentinelBadge[] = [
  {
    id: "harga_tetap",
    name: "Harga Tetap",
    emoji: "🛡️",
    description: "Survived a grocery inflation wave under cap",
    earned: false,
  },
  {
    id: "subsidy_survivor",
    name: "Subsidy Survivor",
    emoji: "⛽",
    description: "Kept fuel spend stable during subsidy shock",
    earned: false,
  },
  {
    id: "inflasi_warrior",
    name: "Inflasi Warrior",
    emoji: "⚔️",
    description: "Completed 3 inflation shield quests",
    earned: false,
  },
  {
    id: "tabung_hero",
    name: "Tabung Hero",
    emoji: "🏺",
    description: "Hit weekly Tabung top-up goal",
    earned: true,
  },
];

export const TABUNG_GOALS: TabungGoal[] = [
  {
    id: "emergency",
    name: "Tabung Kecemasan",
    emoji: "🆘",
    targetRm: 1000,
    savedRm: 420,
    weeklyTopUpRm: 50,
  },
  {
    id: "raya",
    name: "Tabung Raya",
    emoji: "🌙",
    targetRm: 800,
    savedRm: 310,
    weeklyTopUpRm: 40,
  },
];
