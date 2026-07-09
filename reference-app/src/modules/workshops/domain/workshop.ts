import { z } from "zod";

/**
 * Domain vocabulary of the `workshops` module: the Workshop entity and its
 * validation rules, written once as Zod schemas and reused everywhere —
 * tRPC input validation, the create/edit form resolver, and tests.
 *
 * Deliberately JUST the entity schema for now. Business rules (pricing,
 * discounts) arrive with the `pricing` module (WEN-141) — do not invent
 * placeholder logic here before that (AGENTS.md: one implementation ⇒ no
 * interface; no scaffolding "for later").
 */

export const workshopInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000),
  // Full ISO 8601 timestamp with timezone (UTC `Z` or an offset). The form
  // converts the browser's timezone-less datetime-local value before sending.
  date: z.iso.datetime({ offset: true }),
  location: z.string().min(1, "Location is required").max(200),
  listPriceHuf: z.int().nonnegative(),
  capacity: z.int().positive(),
});

export type WorkshopInput = z.infer<typeof workshopInputSchema>;

export const workshopSchema = workshopInputSchema.extend({
  id: z.uuid(),
  // The READ side is strict UTC ISO 8601 ("…Z"). Postgres would hand back
  // its own text format ("2026-01-15 09:00:00+00"), so every repo adapter
  // normalizes timestamps on the way out (infra/timestamps.ts) — consumers
  // see ONE date shape no matter which adapter served the data.
  date: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export type Workshop = z.infer<typeof workshopSchema>;
