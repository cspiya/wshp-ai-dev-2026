import { describe, expect, it } from "vitest";

import type { PaymentPort } from "../application/checkout.router";
import { paymentResultSchema } from "../domain/payment";
import { createFakePaymentAdapter } from "./fake-payment-adapter";

function paymentPortContract(makePort: () => PaymentPort) {
  it("returns a domain-valid result without prescribing vendor id format", async () => {
    const result = await makePort().authorize({
      reference: "order-123",
      amountMinor: 12_345,
      currency: "HUF",
    });
    expect(paymentResultSchema.parse(result).status).toBe("authorized");
  });
}

describe("PaymentPort contract — fake adapter", () => {
  paymentPortContract(() => createFakePaymentAdapter());
});

it("can deterministically exercise the decline path", async () => {
  await expect(
    createFakePaymentAdapter("decline").authorize({
      reference: "order-123",
      amountMinor: 12_345,
      currency: "HUF",
    }),
  ).resolves.toEqual({
    status: "declined",
    reason: "Fake adapter configured to decline",
  });
});

describe("PaymentPort contract - different vendor id shape", () => {
  paymentPortContract(() => ({
    authorize: async () => ({ status: "authorized", paymentId: "vendor-payment-8472" }),
  }));
});

it("the fake adapter uses a stable fake id for workshop assertions", async () => {
  await expect(
    createFakePaymentAdapter().authorize({
      reference: "order-123",
      amountMinor: 12_345,
      currency: "HUF",
    }),
  ).resolves.toEqual({ status: "authorized", paymentId: "fake_order-123" });
});
