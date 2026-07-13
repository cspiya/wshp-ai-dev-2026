import { TRPCError, initTRPC } from "@trpc/server";

/**
 * tRPC initialization — one instance per app.
 * The context carries the authenticated user id (or null). Resolving it is
 * the API route's job (composition), never a module's.
 */
export interface Context {
  userId: string | null;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Server-side session gate for mutations that write user-owned state.
 * Lives in front of the use-case, close to persistence — a client cannot
 * skip it, and modules stay free of auth-vendor imports.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { userId: ctx.userId } });
});
