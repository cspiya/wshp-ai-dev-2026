import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const registrationStatus = pgEnum("registration_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workshopId: uuid("workshop_id").notNull(),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(),
  workshopStartsAt: timestamp("workshop_starts_at", { withTimezone: true, mode: "string" }).notNull(),
  status: registrationStatus("status").notNull().default("pending"),
  registeredAt: timestamp("registered_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "string" }),
});
