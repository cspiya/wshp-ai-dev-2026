import type { WorkshopRepo } from "../application/workshops.router";
import type { Workshop } from "../domain/workshop";

/**
 * In-memory WorkshopRepo — a TEST DOUBLE, not a production adapter.
 *
 * Two consumers:
 * 1. Router contract tests (application/workshops.router.test.ts).
 * 2. The Playwright happy path: `E2E_IN_MEMORY_DB=1` makes `next start`
 *    serve real HTTP against this repo, so e2e runs need no database
 *    (see infra/workshop-repo.ts and playwright.config.ts).
 *
 * State lives in the server process and vanishes on restart — by design.
 */
export function createInMemoryWorkshopRepo(seed: Workshop[] = []): WorkshopRepo {
  const rows = new Map<string, Workshop>(seed.map((w) => [w.id, w]));

  return {
    list: async () =>
      [...rows.values()].sort((a, b) => a.date.localeCompare(b.date)),

    getById: async (id) => rows.get(id) ?? null,

    create: async (input) => {
      const workshop: Workshop = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      rows.set(workshop.id, workshop);
      return workshop;
    },

    update: async (id, input) => {
      const existing = rows.get(id);
      if (!existing) return null;
      const updated: Workshop = { ...existing, ...input };
      rows.set(id, updated);
      return updated;
    },

    delete: async (id) => rows.delete(id),
  };
}
