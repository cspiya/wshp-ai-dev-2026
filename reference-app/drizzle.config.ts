import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // Vertical slices own their schema: each module's tables live in its infra/.
  schema: "./src/modules/*/infra/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
