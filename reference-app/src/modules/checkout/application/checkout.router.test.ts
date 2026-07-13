import { describe, expect, it } from "vitest";

import { createFakePaymentAdapter } from "../infra/fake-payment-adapter";
import { createCheckoutRouter } from "./checkout.router";

describe("checkout router", () => {
  it("authorizes through the injected payment boundary", async () => {
    const caller = createCheckoutRouter(createFakePaymentAdapter()).createCaller({ userId: "test-user" });
    await expect(
      caller.authorize({ reference: "sample-order", amountMinor: 10_287, currency: "HUF" }),
    ).resolves.toEqual({ status: "authorized", paymentId: "fake_sample-order" });
  });

  it("rejects authorization without a session", async () => {
    const caller = createCheckoutRouter(createFakePaymentAdapter()).createCaller({ userId: null });
    await expect(
      caller.authorize({ reference: "sample-order", amountMinor: 10_287, currency: "HUF" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects non-positive amounts before calling the adapter", async () => {
    const payment = { authorize: async () => ({ status: "authorized" as const, paymentId: "x" }) };
    const caller = createCheckoutRouter(payment).createCaller({ userId: "test-user" });
    await expect(
      caller.authorize({ reference: "sample-order", amountMinor: 0, currency: "HUF" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
