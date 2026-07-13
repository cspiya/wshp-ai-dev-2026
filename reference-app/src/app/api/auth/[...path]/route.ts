import { getAuth } from "@/platform/auth/server";

/**
 * Neon Auth proxy route. Wrapped lazily so `next build` succeeds where the
 * auth env vars are absent (CI); the real config check happens per request.
 */
type AuthRouteContext = { params: Promise<{ path: string[] }> };

export function GET(request: Request, context: AuthRouteContext) {
  return getAuth().handler().GET(request, context);
}

export function POST(request: Request, context: AuthRouteContext) {
  return getAuth().handler().POST(request, context);
}
