import { expect, test, type Page } from "@playwright/test";

async function createWorkshop(
  page: Page,
  workshop: { title: string; listPriceHuf: number },
) {
  await page.goto("/workshops");
  await page.getByRole("button", { name: "New workshop" }).click();
  await page.getByLabel("Title").fill(workshop.title);
  await page.getByLabel("Description").fill("Invented fixture owned by the shop e2e journey.");
  await page.getByLabel("Date").fill("2028-02-02T09:00");
  await page.getByLabel("Location").fill("On-site");
  await page.getByLabel("List price (HUF)").fill(String(workshop.listPriceHuf));
  await page.getByLabel("Capacity").fill("12");
  await page.getByRole("button", { name: "Create workshop" }).click();
  await expect(page.getByRole("cell", { name: workshop.title })).toBeVisible();
}

async function deleteWorkshop(page: Page, title: string) {
  await page
    .getByRole("row")
    .filter({ hasText: title })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("cell", { name: title })).not.toBeVisible();
}

/**
 * Webshop journey — the approved feature spec as a browser test:
 * a GUEST buys seats in two different workshops (2 + 1), checks out in
 * company mode with the WELCOME10 coupon, pays through the fake payment
 * boundary and receives an order-summary certificate.
 *
 * The test owns both catalog fixtures and removes them afterwards, so it
 * behaves identically against an empty local store and an arbitrarily seeded
 * Neon preview branch. Expected money math (domain-owned, tested in
 * order.domain.test.ts): net 38 500 → WELCOME10 −3 850 → net 34 650 →
 * VAT (27%, half-up) 9 356 → gross 44 006.
 */
test("guest buys two workshops as a company with a coupon @happy-path", async ({ page }) => {
  // ── arrange: own both fixtures; never depend on preview seed content ──
  const runId = Date.now();
  const firstTitle = `Checkout Flow ${runId}`;
  const secondTitle = `Contract Testing Lab ${runId}`;
  await createWorkshop(page, { title: firstTitle, listPriceHuf: 10_000 });
  await createWorkshop(page, { title: secondTitle, listPriceHuf: 18_500 });

  // ── catalog → product detail (qty 2) → cart ──────────────────────────
  await page.goto("/shop");
  const firstCard = page
    .getByRole("listitem")
    .filter({ hasText: firstTitle });
  await firstCard.getByRole("button", { name: "View details" }).click();

  await expect(
    page.getByRole("heading", { name: firstTitle }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Increase seats/ }).click();
  await expect(page.getByTestId("qty-value")).toHaveText("2");
  // The keycap states the computed gross for 2 seats: 20 000 net → 25 400.
  await expect(page.getByTestId("add-to-cart")).toContainText("25,400 HUF gross");
  await page.getByTestId("add-to-cart").click();

  // ── continue shopping, add the second workshop (qty 1) ───────────────
  await page.getByRole("button", { name: "Continue shopping" }).click();
  await page
    .getByRole("listitem")
    .filter({ hasText: secondTitle })
    .getByRole("button", { name: "Add to cart" })
    .click();

  // ── cart: both lines + server-computed totals ────────────────────────
  await expect(page.getByTestId("cart-count")).toHaveText("3");
  await expect(page.getByText(firstTitle)).toBeVisible();
  await expect(page.getByText(secondTitle)).toBeVisible();
  await expect(page.getByTestId("cart-net")).toHaveText("38,500 HUF");
  await expect(page.getByTestId("cart-vat")).toHaveText("10,395 HUF");
  await expect(page.getByTestId("cart-gross")).toHaveText("48,895 HUF");
  await page.getByTestId("proceed-checkout").click();

  // ── checkout: guest contact + company mode + billing ─────────────────
  await page.getByLabel("Full name").fill("Kiss Anna");
  await page.getByLabel("Email").fill("anna.kiss@example.test");
  await page.getByLabel("Phone").fill("+36 30 123 4567");
  await page.getByLabel(/buying as a company/).check();
  await page.getByLabel(/Company name/).fill("Példa Kft. (invented)");
  await page.getByLabel(/Tax number/).fill("12345678-2-42");
  await page.getByLabel("Country").fill("Hungary");
  await page.getByLabel("Postal code").fill("1051");
  await page.getByLabel("City").fill("Budapest");
  await page.getByLabel("Street address").fill("Minta utca 12.");

  await expect(page.getByText(/No account or sign-in is required/)).toBeVisible();
  await expect(page.getByLabel(/Create an account/)).toHaveCount(0);

  // ── coupon: WELCOME10 drives the discount row via the server preview ──
  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByTestId("coupon-apply").click();
  await expect(page.getByTestId("sum-discount")).toHaveText("− 3,850 HUF");
  await expect(page.getByTestId("sum-vat")).toHaveText("9,356 HUF");
  await expect(page.getByTestId("sum-gross")).toHaveText("44,006 HUF");

  // ── pay: the keycap names the exact gross it authorizes ──────────────
  await expect(page.getByTestId("continue-to-payment")).toContainText(
    "Continue to payment · 44,006 HUF",
  );
  await page.getByTestId("continue-to-payment").click();

  // ── confirmation certificate ──────────────────────────────────────────
  await expect(page.getByTestId("order-number")).toContainText(/REF-2026-\d{4}/);
  await expect(page.getByTestId("order-buyer")).toHaveText(
    "Példa Kft. (invented) · tax nr 12345678-2-42",
  );
  await expect(page.getByTestId("order-items")).toContainText(`2× ${firstTitle} (net 20,000)`);
  await expect(page.getByTestId("order-items")).toContainText(`1× ${secondTitle} (net 18,500)`);
  await expect(page.getByTestId("order-coupon")).toContainText("WELCOME10");
  await expect(page.getByTestId("order-totals")).toContainText(
    "net 34,650 + VAT 9,356 = gross 44,006 HUF",
  );
  await expect(page.getByTestId("order-payment-auth")).toContainText(/^fake_/);

  // ── back to catalog resets the cart ───────────────────────────────────
  await page.getByRole("button", { name: "Back to catalog" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("0");
  await expect(
    page.getByRole("heading", { name: "Book your training" }),
  ).toBeVisible();

  // ── cleanup: preview branches stay re-runnable without fixture accretion ──
  await page.goto("/workshops");
  await deleteWorkshop(page, firstTitle);
  await deleteWorkshop(page, secondTitle);
});
