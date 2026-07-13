import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Auth server instance — a platform concern, like the DB client.
 * Lazy on purpose: builds and DB-less local runs must succeed without the
 * auth env vars (CI has none), so configuration is only demanded at request
 * time by code that actually needs a session.
 */
let cached: ReturnType<typeof createNeonAuth> | null = null;

export function getAuth() {
  if (!cached) {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!baseUrl || !secret) {
      throw new Error(
        "Neon Auth is not configured: set NEON_AUTH_BASE_URL and " +
          "NEON_AUTH_COOKIE_SECRET (see SETUP-STATUS.md).",
      );
    }
    cached = createNeonAuth({ baseUrl, cookies: { secret } });
  }
  return cached;
}

export function isAuthConfigured() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}
