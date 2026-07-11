import { expect, test } from "@playwright/test";

test("price, authorize, register, confirm, and cancel @happy-path", async ({ page }) => {
  await page.goto("/shop");

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
