// A schemeless host (Netlify has NEXT_PUBLIC_API_URL set to a bare
// "…up.railway.app") is treated by fetch() as a *relative* path, so every call
// resolves against the site origin and 404s. Empty stays empty — that is the
// intentional "use the next.config.ts rewrite proxy" mode — and a leading "/"
// is a deliberate same-origin path.
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const API_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")
);

export const BAYARLAH_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BAYARLAH_URL ?? "");

export {
  CATEGORIES,
  VERDICT_CONFIG,
  LEVELS,
  type CategoryId,
} from "@bajetbuddy/shared";

export const WALLET_PROVIDER_LABEL: Record<string, string> = {
  tng: "Touch 'n Go eWallet",
  mae: "MAE by Maybank",
  grabpay: "GrabPay",
  other: "E-Wallet",
};
