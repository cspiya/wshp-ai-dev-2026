import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "@/platform/api/trpc";

import { workshopInputSchema, type Workshop, type WorkshopInput } from "../domain/workshop";

/**
 * Port for workshop persistence. This interface is EARNED, not scaffolding:
 * it has two real implementations — the Drizzle adapter (infra/) for the app
 * and an in-memory double for router contract tests and the Playwright
 * happy path (AGENTS.md: introduce a port only at a boundary that varies).
 */
export interface WorkshopRepo {
  list(): Promise<Workshop[]>;
  getById(id: string): Promise<Workshop | null>;
  create(input: WorkshopInput): Promise<Workshop>;
  update(id: string, input: WorkshopInput): Promise<Workshop | null>;
  delete(id: string): Promise<boolean>;
}

const idInput = z.object({ id: z.uuid() });

/**
 * The module's use-cases as tRPC procedures. A factory (rather than a
 * module-level singleton) so tests can wire a test double where the contract
 * wires the real adapter — same router logic in both.
 */
export function createWorkshopsRouter(repo: WorkshopRepo) {
  return router({
    list: publicProcedure.query(() => repo.list()),

    getById: publicProcedure.input(idInput).query(async ({ input }) => {
      const workshop = await repo.getById(input.id);
      if (!workshop) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Workshop ${input.id} not found` });
      }
      return workshop;
    }),

    create: publicProcedure
      .input(workshopInputSchema)
      .mutation(({ input }) => repo.create(input)),

    update: publicProcedure
      .input(idInput.extend({ data: workshopInputSchema }))
      .mutation(async ({ input }) => {
        const updated = await repo.update(input.id, input.data);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Workshop ${input.id} not found` });
        }
        return updated;
      }),

    delete: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const deleted = await repo.delete(input.id);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Workshop ${input.id} not found` });
      }
      return { id: input.id };
    }),
  });
}
