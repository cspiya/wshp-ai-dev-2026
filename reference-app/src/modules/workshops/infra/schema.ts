import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Drizzle schema of the `workshops` module — the first real table of the app.
 * drizzle.config.ts globs every module's infra/schema.ts, so migrations are
 * generated per slice: `npm run db:generate` after editing this file.
 */
export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  date: timestamp("date", { withTimezone: true, mode: "string" }).notNull(),
  location: text("location").notNull(),
  listPriceHuf: integer("list_price_huf").notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
