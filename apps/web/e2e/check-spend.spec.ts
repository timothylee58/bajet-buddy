import { test, expect } from "@playwright/test";

// Exercises the flagship Check Spend flow end to end in a real browser:
// amount entry -> merchant -> Check Spend -> a verdict is rendered.
//
// Guest mode is seeded directly via localStorage (rather than driving the
// multi-step onboarding wizard at /start) so this test stays focused on the
// Check flow itself. The manual Check screen degrades gracefully to a
// locally-computed demo verdict when the API is unreachable (see
// CheckScreen.tsx's handleCheck catch block), so no backend process needs to
// be orchestrated for this suite to exercise the full user-facing flow.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bb_guest_mode", "true");
  });
});

test("manual check produces a verdict the user can see", async ({ page }) => {
  await page.goto("/check");

  await page.getByRole("button", { name: "Manual", exact: true }).click();

  await page.getByTestId("numpad-1").click();
  await page.getByTestId("numpad-8").click();
  await page.getByTestId("numpad-9").click();
  await expect(page.getByTestId("amount-display")).toContainText("189");

  await page.getByTestId("merchant-input").fill("Shopee Malaysia");

  await page.getByTestId("check-spend-button").click();

  await expect(page.getByTestId("verdict-overlay")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("verdict-label")).not.toBeEmpty();

  // Walk away from the check
  await page.getByTestId("check-another-button").click();
  await expect(page.getByTestId("verdict-overlay")).toBeHidden();
});

test("check-spend button stays disabled until an amount is entered", async ({ page }) => {
  await page.goto("/check");
  await page.getByRole("button", { name: "Manual", exact: true }).click();

  await expect(page.getByTestId("check-spend-button")).toBeDisabled();

  await page.getByTestId("numpad-5").click();
  await expect(page.getByTestId("check-spend-button")).toBeEnabled();
});
