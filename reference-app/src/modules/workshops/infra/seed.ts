import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import { workshops } from "./schema";

/**
 * Demo rows for local development and previews. Deliberately GENERIC:
 * this repo is public, so seed data must never mirror a real engagement
 * (no real titles, dates, prices, or capacities).
 */
const samples = [
  {
    title: "Sample Workshop: Intro to Agentic Development",
    description: "Generic sample data for local development.",
    date: "2027-01-15T09:00:00+01:00",
    location: "Online",
    listPriceHuf: 99000,
    capacity: 20,
  },
  {
    title: "Sample Workshop: TypeScript Foundations",
    description: "Generic sample data for local development.",
    date: "2027-02-20T09:00:00+01:00",
    location: "Online",
    listPriceHuf: 49000,
    capacity: 20,
  },
  {
    title: "Sample Workshop: Postgres in Practice",
    description: "Generic sample data for local development.",
    date: "2027-03-10T09:00:00+01:00",
    location: "Online",
    listPriceHuf: 59000,
    capacity: 15,
  },
];

/**
 * Insert the demo workshops. Idempotent by title — safe to re-run.
 * Seeding is module knowledge (which rows make a meaningful demo), so it
 * lives HERE and is exported through the contract; scripts/seed.ts is only
 * a thin runner that supplies the db handle. Returns the inserted titles.
 */
export async function seedDemoWorkshops(db: NeonHttpDatabase): Promise<string[]> {
  const existing = new Set(
    (await db.select({ title: workshops.title }).from(workshops)).map((row) => row.title),
  );
  const toInsert = samples.filter((sample) => !existing.has(sample.title));
  if (toInsert.length > 0) {
    await db.insert(workshops).values(toInsert);
  }
  return toInsert.map((sample) => sample.title);
}
