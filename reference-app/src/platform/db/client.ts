import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import { env } from "@/platform/env";

/**
 * Drizzle over the Neon serverless (HTTP) driver.
 * Lazy singleton: the connection is created on first use, so code paths that
 * never touch the DB (build, health check, unit tests) need no DATABASE_URL.
 */
let db: NeonHttpDatabase | null = null;

export function getDb(): NeonHttpDatabase {
  if (!db) {
    db = drizzle(neon(env("DATABASE_URL")));
  }
  return db;
}
