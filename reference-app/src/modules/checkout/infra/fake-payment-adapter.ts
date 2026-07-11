import type { PaymentPort } from "../application/checkout.router";

export type FakePaymentMode = "approve" | "decline";

/** Deterministic teaching adapter. It performs no network or money movement. */
export function createFakePaymentAdapter(mode: FakePaymentMode = "approve"): PaymentPort {
  return {
    authorize: async (request) =>
      mode === "approve"
        ? { status: "authorized", paymentId: `fake_${request.reference}` }
        : { status: "declined", reason: "Fake adapter configured to decline" },
  };
}
