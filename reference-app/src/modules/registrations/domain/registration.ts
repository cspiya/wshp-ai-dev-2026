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

export const DEFAULT_CANCELLATION_WINDOW_HOURS = 48;
export const CANCELLATION_WINDOW_MS = DEFAULT_CANCELLATION_WINDOW_HOURS * 60 * 60 * 1_000;

export function canCancelRegistration(
  workshopStartsAt: string,
  now: Date,
  windowMs: number = CANCELLATION_WINDOW_MS,
): boolean {
  // Exclusive boundary per approved spec (WEN-118, ratified 2026-07-12):
  // cancellation exactly at workshopStartsAt minus the window is rejected;
  // strictly earlier is allowed. The window is configurable — wired at the
  // composition root, never read from env here (domain stays pure).
  return Date.parse(workshopStartsAt) - now.getTime() > windowMs;
}
