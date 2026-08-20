import { defineConfig, devices } from "@playwright/test";

// Guest mode never calls the backend for the manual Check flow (CheckScreen
// falls back to a locally-computed demo verdict on fetch failure), so this
// suite only needs the Next.js dev server — no API process to orchestrate.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    // Point at a pre-fetched Chromium build (e.g. a locally cached revision
    // that doesn't match this package's pinned version) instead of the one
    // `npx playwright install` would download. Unset by default everywhere.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
    },
  },
});
