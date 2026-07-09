import { expect, test } from "@playwright/test";

/**
 * The ONE golden-path browser test: create a workshop, see it in the list.
 * Tagged @happy-path so a preview pipeline can select exactly this test:
 * `npx playwright test --grep @happy-path`.
 *
 * The unique title keeps the test re-runnable against a shared preview
 * database, not just the throwaway in-memory server.
 */
test("create a workshop and see it in the list @happy-path", async ({ page }) => {
  await page.goto("/workshops");

  await page.getByRole("button", { name: "New workshop" }).click();

  const title = `Playwright Workshop ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Created by the e2e happy path.");
  await page.getByLabel("Date").fill("2026-09-01T09:00");
  await page.getByLabel("Location").fill("Budapest");
  await page.getByLabel("List price (HUF)").fill("99000");
  await page.getByLabel("Capacity").fill("10");
  await page.getByRole("button", { name: "Create workshop" }).click();

  await expect(page.getByRole("cell", { name: title })).toBeVisible();
});
