import { z } from "zod";

export const paymentRequestSchema = z.object({
  reference: z.string().min(1).max(100),
  amountMinor: z.int().positive().max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export const paymentResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("authorized"), paymentId: z.string().min(1) }),
  z.object({ status: z.literal("declined"), reason: z.string().min(1) }),
]);

export type PaymentResult = z.infer<typeof paymentResultSchema>;
