import type {
  InflationImpact,
  MacroMarketEvent,
  MockSentinelTransaction,
  PokaiForecast,
  QuestDifficulty,
  RiskProfileType,
  SurvivalQuest,
} from "@bajetbuddy/shared";
import { DEMO_USER, MOCK_TRANSACTIONS } from "./mock-data";

const GROCERY_MERCHANTS = /mydin|lotus|nsk|aeon|giant|jaya|village/i;
const FUEL_MERCHANTS = /petronas|shell|bhp|caltex|petron/i;
const DELIVERY_MERCHANTS = /grabfood|foodpanda|shopeefood/i;

function sumByCategory(
  transactions: MockSentinelTransaction[],
  categoryId: string
): number {
  return transactions
    .filter((t) => t.categoryId === categoryId)
    .reduce((acc, t) => acc + t.amount, 0);
}

export function computeRiskProfile(
  transactions: MockSentinelTransaction[] = MOCK_TRANSACTIONS
): RiskProfileType {
  const total = transactions.reduce((a, t) => a + t.amount, 0);
  if (total <= 0) return "balanced";

  const grocery = sumByCategory(transactions, "groceries") / total;
  const fuel = sumByCategory(transactions, "fuel") / total;
  const delivery = sumByCategory(transactions, "food_delivery") / total;

  const essentials = grocery + fuel;
  if (essentials > 0.72 && grocery > fuel) return "grocery_sensitive";
  if (essentials > 0.72 && fuel >= grocery) return "fuel_sensitive";
  if (delivery > 0.28) return "delivery_sensitive";
  if (essentials > 0.55 && DEMO_USER.balance < 600) return "vulnerable_consumer";
  return "balanced";
}

export const RISK_PROFILE_META: Record<
  RiskProfileType,
  { label: string; emoji: string; color: string; blurb: string }
> = {
  grocery_sensitive: {
    label: "Grocery-Sensitive",
    emoji: "🛒",
    color: "from-brand to-brand-dark",
    blurb: "Most of your burn tracks Mydin, Lotus's & NSK — inflation hits you at the trolley.",
  },
  fuel_sensitive: {
    label: "Fuel-Sensitive",
    emoji: "⛽",
    color: "from-brand to-brand-dark",
    blurb: "Petronas & Shell dominate your month — subsidy news is your weather report.",
  },
  delivery_sensitive: {
    label: "Delivery-Sensitive",
    emoji: "🍜",
    color: "from-brand to-brand-dark",
    blurb: "GrabFood & foodpanda are eating your runway — logistics shocks sting twice.",
  },
  vulnerable_consumer: {
    label: "Vulnerable Consumer",
    emoji: "⚠️",
    color: "from-rose-500 to-red-600",
    blurb: "Essentials-heavy + thin balance — macro shocks can push you into pokai territory fast.",
  },
  balanced: {
    label: "Balanced Spender",
    emoji: "⚖️",
    color: "from-brand to-brand-dark",
    blurb: "Your mix is spread out — still watch groceries & fuel when headlines turn red.",
  },
};

export function computeInflationImpact(
  event: MacroMarketEvent,
  transactions: MockSentinelTransaction[] = MOCK_TRANSACTIONS
): InflationImpact {
  const severityMult = 0.6 + event.severity / 100;
  const weeklyRm = Math.round(event.weeklyImpactRm * severityMult);

  const categoryBreakdown = event.affectedCategories.map((categoryId) => {
    const spent = sumByCategory(transactions, categoryId);
    const weight = spent / Math.max(transactions.reduce((a, t) => a + t.amount, 0), 1);
    const deltaRm = Math.round(weeklyRm * Math.max(weight, 0.25) * 10) / 10;
    const label =
      categoryId === "groceries"
        ? "Groceries"
        : categoryId === "fuel"
          ? "Fuel"
          : categoryId === "food_delivery"
            ? "Food delivery"
            : "Entertainment";
    return { categoryId, label, deltaRm };
  });

  const pokaiRiskDelta = Math.min(35, Math.round(event.severity * 0.4));

  return {
    weeklyRm,
    monthlyRm: Math.round(weeklyRm * 4.3),
    categoryBreakdown,
    pokaiRiskDelta,
  };
}

export function buildSurvivalQuest(
  event: MacroMarketEvent,
  impact: InflationImpact
): SurvivalQuest {
  const primary = event.affectedCategories[0] ?? "groceries";
  const capBase =
    primary === "groceries" ? 150 : primary === "fuel" ? 200 : 90;
  const scale =
    event.difficulty === "critical" ? 0.85 : event.difficulty === "rising" ? 0.92 : 1;

  const spendCapRm = Math.round(capBase * scale);
  const rewardXp =
    event.difficulty === "critical" ? 400 : event.difficulty === "rising" ? 300 : 180;

  return {
    id: `quest-${event.id}-${Date.now()}`,
    title: "Inflation Shield Survival Quest",
    description: `Keep ${primary.replace("_", " ")} spend under ${spendCapRm} this week despite the macro shock.`,
    targetCategoryId: primary,
    spendCapRm,
    rewardXp,
    badgeId: primary === "fuel" ? "subsidy_survivor" : "harga_tetap",
    badgeName: primary === "fuel" ? "Subsidy Survivor" : "Harga Tetap",
    badgeEmoji: primary === "fuel" ? "⛽" : "🛡️",
    daysLeft: 7,
    progressPct: 0,
    active: true,
    completed: false,
  };
}

export function computePokaiForecast(
  impact?: InflationImpact | null,
  baseScore = 34
): PokaiForecast {
  const score = Math.min(99, baseScore + (impact?.pokaiRiskDelta ?? 0));
  const daysToPokai =
    score >= 75 ? 4 : score >= 55 ? 11 : score >= 40 ? 18 : null;

  let label = "Steady";
  if (score >= 75) label = "High pokai risk";
  else if (score >= 55) label = "Watch runway";
  else if (score >= 40) label = "Caution zone";

  return {
    score,
    label,
    daysToPokai,
    messageBm:
      daysToPokai != null
        ? `Kalau trend macam ni, baki boleh kritikal dalam ~${daysToPokai} hari.`
        : "Runway masih okay — jangan complacent bila inflasi panas.",
    messageEn:
      daysToPokai != null
        ? `At this rate, funds could get critical in ~${daysToPokai} days.`
        : "Runway still okay — don't get complacent when inflation heats up.",
  };
}

export function questDifficultyLabel(d: QuestDifficulty): string {
  if (d === "critical") return "Critical wave";
  if (d === "rising") return "Rising pressure";
  return "Calm alert";
}

export function matchMerchantSensitivity(merchant: string): string {
  if (GROCERY_MERCHANTS.test(merchant)) return "groceries";
  if (FUEL_MERCHANTS.test(merchant)) return "fuel";
  if (DELIVERY_MERCHANTS.test(merchant)) return "food_delivery";
  return "other";
}
