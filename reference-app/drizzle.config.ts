import { defineConfig } from "drizzle-kit";

import { env } from "./src/platform/env";

export default defineConfig({
  dialect: "postgresql",
  // Vertical slices own their schema: each module's tables live in its infra/.
  schema: "./src/modules/*/infra/schema.ts",
  out: "./drizzle",
  // env() (src/platform/env.ts) fails fast with a helpful message when
  // DATABASE_URL is missing — drizzle-kit commands need it, `next build` doesn't.
  dbCredentials: { url: env("DATABASE_URL") },
});
