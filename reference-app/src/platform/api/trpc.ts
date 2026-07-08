import { initTRPC } from "@trpc/server";

/**
 * tRPC initialization — one instance per app.
 * Context is empty for now; auth/session lands here when a slice needs it.
 */
export type Context = Record<string, never>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
