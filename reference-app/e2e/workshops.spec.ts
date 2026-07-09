import { expect, test } from "@playwright/test";

/**
 * The ONE golden-path browser test: create a workshop, see it in the list,
 * then delete it and see it disappear. Tagged @happy-path so a preview
 * pipeline can select exactly this test:
 * `npx playwright test --grep @happy-path`.
 *
 * The unique title keeps the test re-runnable against a shared preview
 * database — and the final delete step doubles as cleanup, so repeated runs
 * do not accrete rows there.
 *
 * A delete-FAILURE path (server error surfacing in the UI) is not covered
 * here: it cannot be triggered honestly through this UI without mocking the
 * network layer. The router-level NOT_FOUND behavior is covered in
 * application/workshops.router.test.ts; the UI renders `remove.error` when
 * it happens.
 */
test("create a workshop, see it listed, then delete it @happy-path", async ({ page }) => {
  await page.goto("/workshops");

  await page.getByRole("button", { name: "New workshop" }).click();

  const title = `Playwright Workshop ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Created by the e2e happy path.");
  await page.getByLabel("Date").fill("2027-09-01T09:00");
  await page.getByLabel("Location").fill("Online");
  await page.getByLabel("List price (HUF)").fill("99000");
  await page.getByLabel("Capacity").fill("10");
  await page.getByRole("button", { name: "Create workshop" }).click();

  await expect(page.getByRole("cell", { name: title })).toBeVisible();

  await page
    .getByRole("row")
    .filter({ hasText: title })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page.getByRole("cell", { name: title })).not.toBeVisible();
});
