import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "@/platform/api/trpc";

import {
  workshopInputSchema,
  workshopSchema,
  type Workshop,
  type WorkshopInput,
} from "../domain/workshop";

/**
 * Port for workshop persistence. It is EARNED because persistence is a
 * boundary that actually varies (AGENTS.md: DB, payment vendor, LLM
 * provider) — the concrete store can change under the app without the
 * use-cases noticing. To be explicit: the in-memory TEST DOUBLE does NOT
 * count as a "second implementation" that licenses an interface — doubles
 * exist BECAUSE the port exists, never the other way around. If your
 * dependency isn't a varying boundary, don't copy this pattern.
 */
export interface WorkshopRepo {
  /** Chronological by date, bounded (first 50) — see the adapters. */
  list(): Promise<Workshop[]>;
  getById(id: string): Promise<Workshop | null>;
  create(input: WorkshopInput): Promise<Workshop>;
  update(id: string, input: WorkshopInput): Promise<Workshop | null>;
  delete(id: string): Promise<boolean>;
}

// Derived from the entity schema so the id rule lives in exactly one place.
const idInput = workshopSchema.pick({ id: true });

const notFound = (id: string) =>
  new TRPCError({ code: "NOT_FOUND", message: `Workshop ${id} not found` });

/**
 * The module's use-cases as tRPC procedures. A factory (rather than a
 * module-level singleton) so the composition root (src/platform/api/root.ts)
 * decides which adapter to inject — tests inject the double the same way.
 */
export function createWorkshopsRouter(repo: WorkshopRepo) {
  return router({
    list: publicProcedure.query(() => repo.list()),

    create: publicProcedure
      .input(workshopInputSchema)
      .mutation(({ input }) => repo.create(input)),

    update: publicProcedure
      .input(idInput.extend({ data: workshopInputSchema }))
      .mutation(async ({ input }) => {
        const updated = await repo.update(input.id, input.data);
        if (!updated) throw notFound(input.id);
        return updated;
      }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const deleted = await repo.delete(input.id);
      if (!deleted) throw notFound(input.id);
      return { id: input.id };
    }),
  });
}
