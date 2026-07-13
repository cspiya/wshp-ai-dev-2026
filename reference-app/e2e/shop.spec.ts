import { expect, test } from "@playwright/test";

test("price, authorize, register, confirm, and cancel @happy-path", async ({ page }) => {
  await page.goto("/shop");

  // WEN-311 wizard navigation: the shop journey now starts with a workshop
  // selection step (step 01) — pick the first catalog card.
  await page.getByRole("button", { name: "Select & continue" }).first().click();

  // Against a deployed preview the writes need a real Neon Auth session;
  // locally the in-memory seam supplies a fixed user, so no sign-up runs.
  if (process.env.PLAYWRIGHT_BASE_URL) {
    await page.getByTestId("auth-email").fill(`e2e-${Date.now()}@example.test`);
    await page.getByTestId("auth-password").fill("e2e-Sample-Passw0rd");
    await page.getByTestId("auth-signup").click();
    await expect(page.getByTestId("auth-status")).toContainText("Signed in", {
      timeout: 15_000,
    });
  }

  // WEN-311 wizard navigation: acknowledge the account step (step 02).
  await page.getByRole("button", { name: "Continue to price & payment" }).click();

  // WEN-311: the quote's list price is now prefilled from the SELECTED
  // workshop. Pin it to the original fixture value so the exact expected
  // total (10287 HUF) stays deterministic on every target, including a
  // preview whose first catalog entry has a different price.
  await page.getByLabel("List price (minor units)").fill("10000");

  await page.getByRole("button", { name: "Calculate price" }).click();
  await expect(page.getByTestId("quote-total")).toContainText("10287 HUF");

  await page.getByRole("button", { name: "Authorize fake payment" }).click();
  await expect(page.getByTestId("payment-result")).toHaveText("Payment: authorized");

  await page.getByRole("button", { name: "Create registration" }).click();
  await expect(page.getByTestId("registration-status")).toHaveText("Registration: pending");

  await page.getByRole("button", { name: "Confirm registration" }).click();
  await expect(page.getByTestId("confirmed-status")).toHaveText("Registration: confirmed");

  await page.getByRole("button", { name: "Cancel registration" }).click();
  await expect(page.getByTestId("cancelled-status")).toHaveText("Registration: cancelled");
});
