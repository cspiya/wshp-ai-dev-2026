/**
 * Minimal env access. Values are read lazily (at call time, not import time)
 * so `next build` and unit tests pass without secrets.
 */
// Extend this union as the app grows — typos become compile errors.
type KnownEnvVar = "DATABASE_URL";

export function env(name: KnownEnvVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name} — copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}
