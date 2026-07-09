import type { WorkshopRepo } from "../application/workshops.router";
import { createDrizzleWorkshopRepo } from "./drizzle-workshop-repo";
import { createInMemoryWorkshopRepo } from "./in-memory-workshop-repo";

/**
 * Adapter selection for the WorkshopRepo port.
 *
 * `E2E_IN_MEMORY_DB=1` is an e2e escape hatch ONLY: it lets the Playwright
 * happy path run against a plain `next start` without any database
 * (playwright.config.ts sets it for its web server). Never set it in a real
 * deployment. With the flag unset — the default everywhere else — the
 * Drizzle adapter is used, and a missing DATABASE_URL surfaces as a clear
 * error on the first query (src/platform/env.ts), never a silent fallback.
 */
export function createWorkshopRepo(): WorkshopRepo {
  return process.env.E2E_IN_MEMORY_DB === "1"
    ? createInMemoryWorkshopRepo()
    : createDrizzleWorkshopRepo();
}
