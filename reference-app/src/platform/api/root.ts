import { z } from "zod";

import { publicProcedure, router } from "@/platform/api/trpc";

/**
 * Root router. Feature modules contribute sub-routers here
 * (e.g. `tasks: tasksRouter` imported from the module's contract).
 */
export const appRouter = router({
  health: router({
    // End-to-end wiring proof: Zod-validated input, typed output,
    // consumed by the homepage via TanStack Query.
    // `min(1)` rejects the empty string AT the boundary, so the handler
    // needs no emptiness check — validate in the schema, not in the logic.
    ping: publicProcedure
      .input(z.object({ name: z.string().min(1).max(50).optional() }).optional())
      .query(({ input }) => ({
        ok: true as const,
        message: input?.name ? `pong, ${input.name}` : "pong",
        time: new Date().toISOString(),
      })),
  }),
});

export type AppRouter = typeof appRouter;
