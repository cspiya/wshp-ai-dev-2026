import { asc, eq } from "drizzle-orm";

import { getDb } from "@/platform/db/client";

import type { WorkshopRepo } from "../application/workshops.router";
import type { Workshop } from "../domain/workshop";
import { workshops } from "./schema";
import { toIsoTimestamp } from "./timestamps";

/** Postgres text timestamps → the strict UTC ISO shape the domain promises. */
function toWorkshop(row: typeof workshops.$inferSelect): Workshop {
  return { ...row, date: toIsoTimestamp(row.date), createdAt: toIsoTimestamp(row.createdAt) };
}

/**
 * Drizzle/Neon adapter for the WorkshopRepo port. `getDb()` is a lazy
 * singleton, so merely constructing this repo needs no DATABASE_URL —
 * a missing one surfaces as a clear error on the first actual query
 * (see src/platform/env.ts), and the UI shows its error state.
 */
export function createDrizzleWorkshopRepo(): WorkshopRepo {
  return {
    // Lists are always bounded: an unbounded SELECT is a slow-motion outage.
    list: async () => {
      const rows = await getDb()
        .select()
        .from(workshops)
        .orderBy(asc(workshops.date))
        .limit(50);
      return rows.map(toWorkshop);
    },

    create: async (input) => {
      const rows = await getDb().insert(workshops).values(input).returning();
      return toWorkshop(rows[0]);
    },

    update: async (id, input) => {
      const rows = await getDb()
        .update(workshops)
        .set(input)
        .where(eq(workshops.id, id))
        .returning();
      return rows[0] ? toWorkshop(rows[0]) : null;
    },

    delete: async (id) => {
      const rows = await getDb()
        .delete(workshops)
        .where(eq(workshops.id, id))
        .returning({ id: workshops.id });
      return rows.length > 0;
    },
  };
}
