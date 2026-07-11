import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/platform/db/client";

import type { RegistrationRepo } from "../application/registrations.router";
import type { Registration } from "../domain/registration";
import { registrations } from "./schema";
import { toIsoTimestamp } from "./timestamps";

function toRegistration(row: typeof registrations.$inferSelect): Registration {
  return {
    ...row,
    workshopStartsAt: toIsoTimestamp(row.workshopStartsAt),
    registeredAt: toIsoTimestamp(row.registeredAt),
    cancelledAt: row.cancelledAt ? toIsoTimestamp(row.cancelledAt) : null,
  };
}

export function createDrizzleRegistrationRepo(): RegistrationRepo {
  return {
    list: async () =>
      (await getDb().select().from(registrations).orderBy(asc(registrations.registeredAt)).limit(50)).map(
        toRegistration,
      ),
    getById: async (id) => {
      const rows = await getDb().select().from(registrations).where(eq(registrations.id, id)).limit(1);
      return rows[0] ? toRegistration(rows[0]) : null;
    },
    create: async (input) => {
      const rows = await getDb().insert(registrations).values(input).returning();
      return toRegistration(rows[0]);
    },
    transitionStatus: async (id, expectedStatuses, nextStatus, cancelledAt) => {
      const rows = await getDb()
        .update(registrations)
        .set({ status: nextStatus, cancelledAt })
        .where(and(eq(registrations.id, id), inArray(registrations.status, expectedStatuses)))
        .returning();
      return rows[0] ? toRegistration(rows[0]) : null;
    },
  };
}
