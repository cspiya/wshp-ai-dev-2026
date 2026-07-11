import { z } from "zod";

export const registrationStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

export const registrationInputSchema = z.strictObject({
  workshopId: z.uuid(),
  participantName: z.string().min(1).max(200),
  participantEmail: z.email().max(320),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

export const registrationRecordInputSchema = registrationInputSchema.extend({
  workshopStartsAt: z.iso.datetime({ offset: true }),
});

export type RegistrationRecordInput = z.infer<typeof registrationRecordInputSchema>;

export const registrationSchema = registrationRecordInputSchema.extend({
  id: z.uuid(),
  workshopStartsAt: z.iso.datetime(),
  status: registrationStatusSchema,
  registeredAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
});

export type Registration = z.infer<typeof registrationSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

export const CANCELLATION_WINDOW_MS = 48 * 60 * 60 * 1_000;

export function canCancelRegistration(workshopStartsAt: string, now: Date): boolean {
  return Date.parse(workshopStartsAt) - now.getTime() >= CANCELLATION_WINDOW_MS;
}
