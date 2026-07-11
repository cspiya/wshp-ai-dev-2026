import type { WorkshopRepo } from "../application/workshops.router";
import type { Workshop } from "../domain/workshop";
import { toIsoTimestamp } from "./timestamps";

/**
 * In-memory WorkshopRepo — a TEST DOUBLE, not a production adapter
 * (and NOT what earns the port its existence — see the port's comment).
 *
 * Two consumers:
 * 1. Tests: the router contract tests and the shared repo contract suite
 *    (infra/workshop-repo.contract.test.ts) run against it without a DB.
 * 2. The Playwright happy path: the composition root (src/platform/api/root.ts)
 *    wires it in under `E2E_IN_MEMORY_DB=1`, so `next start` serves real HTTP
 *    without a database (see playwright.config.ts).
 *
 * It mimics the real adapter's observable behavior on purpose: timestamps
 * are normalized to UTC ISO, lists are chronological and bounded, and no
 * live reference to internal state ever escapes (callers get copies).
 * State lives in the server process and vanishes on restart — by design.
 */
export function createInMemoryWorkshopRepo(seed: Workshop[] = []): WorkshopRepo {
  const rows = new Map<string, Workshop>(
    seed.map((w) => [
      w.id,
      { ...w, date: toIsoTimestamp(w.date), createdAt: toIsoTimestamp(w.createdAt) },
    ]),
  );

  return {
    // Chronological (epoch) order, NOT string order: with mixed UTC offsets
    // the two disagree — the shared contract suite pins this down.
    // Bounded to 50 like the real adapter.
    list: async () =>
      [...rows.values()]
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .slice(0, 50)
        .map((w) => ({ ...w })),

    getById: async (id) => {
      const workshop = rows.get(id);
      return workshop ? { ...workshop } : null;
    },

    create: async (input) => {
      const workshop: Workshop = {
        ...input,
        date: toIsoTimestamp(input.date),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      rows.set(workshop.id, workshop);
      return { ...workshop };
    },

    update: async (id, input) => {
      const existing = rows.get(id);
      if (!existing) return null;
      const updated: Workshop = { ...existing, ...input, date: toIsoTimestamp(input.date) };
      rows.set(id, updated);
      return { ...updated };
    },

    delete: async (id) => rows.delete(id),
  };
}
