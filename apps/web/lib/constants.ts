export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export {
  CATEGORIES,
  VERDICT_CONFIG,
  LEVELS,
  type CategoryId,
} from "@bajetbuddy/shared";
