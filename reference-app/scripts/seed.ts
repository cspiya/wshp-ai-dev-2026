/**
 * Thin runner for `npm run db:seed` (apply migrations first: `db:push`).
 * All the knowledge lives elsewhere, on purpose:
 * - WHAT to seed → the workshops module (exported through its contract);
 * - HOW to connect → the platform db client (env() fails fast with a clear
 *   message when DATABASE_URL is missing);
 * - .env loading → the npm script (`tsx --env-file-if-exists=.env`), not
 *   hand-rolled parsing here.
 * scripts/ is fenced by the same boundary lint as src/ — cross-module
 * internals are off limits, so a runner can only ever use contracts.
 */
import { seedDemoWorkshops } from "@/modules/workshops/workshops.contract";
import { getDb } from "@/platform/db/client";

async function main() {
  const inserted = await seedDemoWorkshops(getDb());
  console.log(
    inserted.length === 0
      ? "Seed data already present — nothing to do."
      : `Inserted ${inserted.length} workshop(s): ${inserted.join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
