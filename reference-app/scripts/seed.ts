/**
 * Seed sample workshops: `npm run db:seed` (needs DATABASE_URL, run
 * `npm run db:push` or apply migrations first). Idempotent by title —
 * safe to re-run.
 */
import fs from "node:fs";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { workshops } from "../src/modules/workshops/infra/schema";

const samples = [
  {
    title: "AI-Assisted Development Workshop",
    description:
      "One-day hands-on workshop: agentic coding with Claude Code on a greenfield Next.js + Neon stack.",
    date: "2026-07-14T09:00:00+02:00",
    location: "Budapest",
    listPriceHuf: 120000,
    capacity: 5,
  },
  {
    title: "Sample Workshop: TypeScript Foundations",
    description: "Generic sample data for local development.",
    date: "2026-08-20T09:00:00+02:00",
    location: "Online",
    listPriceHuf: 49000,
    capacity: 20,
  },
  {
    title: "Sample Workshop: Postgres in Practice",
    description: "Generic sample data for local development.",
    date: "2026-09-10T09:00:00+02:00",
    location: "Online",
    listPriceHuf: 59000,
    capacity: 15,
  },
];

async function main() {
  // Mirror drizzle-kit's convenience: pick DATABASE_URL up from .env when
  // the shell doesn't provide it (tsx does not auto-load .env files).
  if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
    const match = fs.readFileSync(".env", "utf8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m);
    if (match) process.env.DATABASE_URL = match[1];
  }
  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing environment variable DATABASE_URL — copy .env.example to .env and fill it in.",
    );
    process.exit(1);
  }

  const db = drizzle(neon(process.env.DATABASE_URL));

  const existing = new Set(
    (await db.select({ title: workshops.title }).from(workshops)).map((row) => row.title),
  );
  const toInsert = samples.filter((sample) => !existing.has(sample.title));

  if (toInsert.length === 0) {
    console.log("Seed data already present — nothing to do.");
    return;
  }

  await db.insert(workshops).values(toInsert);
  console.log(`Inserted ${toInsert.length} workshop(s): ${toInsert.map((s) => s.title).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
