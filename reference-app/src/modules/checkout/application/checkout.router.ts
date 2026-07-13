import { publicProcedure, router } from "@/platform/api/trpc";

import {
  paymentRequestSchema,
  paymentResultSchema,
  type PaymentRequest,
  type PaymentResult,
} from "../domain/payment";

export interface PaymentPort {
  authorize(request: PaymentRequest): Promise<PaymentResult>;
}

export function createCheckoutRouter(payment: PaymentPort) {
  return router({
    authorize: publicProcedure.input(paymentRequestSchema).mutation(async ({ input }) =>
      paymentResultSchema.parse(await payment.authorize(input)),
    ),
  });
}
