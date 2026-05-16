export const CATEGORIES = [
  { id: "food", name: "Food & Drinks", emoji: "🍜" },
  { id: "transport", name: "Transport", emoji: "🚗" },
  { id: "shopping", name: "Shopping", emoji: "🛍️" },
  { id: "entertainment", name: "Entertainment", emoji: "🎮" },
  { id: "health", name: "Health", emoji: "💊" },
  { id: "utilities", name: "Utilities", emoji: "💡" },
  { id: "education", name: "Education", emoji: "📚" },
  { id: "other", name: "Other", emoji: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const VERDICT_CONFIG = {
  boleh: {
    label: "Boleh! ✅",
    labelEN: "Go ahead!",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    emoji: "✅",
  },
  fikir_dulu: {
    label: "Fikir Dulu 🤔",
    labelEN: "Think first",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    emoji: "🤔",
  },
  jangan_dulu: {
    label: "Jangan Dulu ❌",
    labelEN: "Not now",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    emoji: "❌",
  },
} as const;

export const LEVELS = [
  { level: 1, name: "Bajet Baru", minXP: 0, maxXP: 200 },
  { level: 2, name: "Jimat Sikit", minXP: 200, maxXP: 500 },
  { level: 3, name: "Duit Savvy", minXP: 500, maxXP: 1000 },
  { level: 4, name: "Budget Pro", minXP: 1000, maxXP: 2000 },
  { level: 5, name: "BajetBuddy Legend", minXP: 2000, maxXP: Infinity },
] as const;
