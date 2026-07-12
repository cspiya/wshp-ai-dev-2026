import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/platform/api/root";
import type { Context } from "@/platform/api/trpc";
import { getAuth, isAuthConfigured } from "@/platform/auth/server";

/**
 * Context composition: the ONE place that turns a request into a userId.
 *
 * - Local e2e seam (`E2E_IN_MEMORY_DB=1`, hard-blocked on Vercel by the
 *   composition root): a fixed fake user, so the happy path runs with no
 *   auth service — same seam philosophy as the in-memory repo.
 * - Auth not configured (CI builds, bare local dev): anonymous context;
 *   protected procedures reply 401 instead of crashing the route.
 * - Otherwise: the Neon Auth session cookie decides.
 */
async function createContext(): Promise<Context> {
  if (process.env.E2E_IN_MEMORY_DB === "1" && !process.env.VERCEL) {
    return { userId: "local-e2e-user" };
  }
  if (!isAuthConfigured()) {
    return { userId: null };
  }
  const { data } = await getAuth().getSession();
  return { userId: data?.user?.id ?? null };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
