import { defineConfig } from "@playwright/test";

/**
 * Two targets, one switch:
 *
 * - Local (default): `npm run test:e2e` builds and starts the production
 *   server itself, with E2E_IN_MEMORY_DB=1 so no database is needed
 *   (the composition root wires the in-memory repo — src/platform/api/root.ts;
 *   the same file hard-blocks the flag on Vercel).
 * - Preview: set PLAYWRIGHT_BASE_URL to a deployed URL and the same tests
 *   run against it, no local server started:
 *   `PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app npm run test:e2e`
 */
const previewUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: previewUrl ?? "http://localhost:3000" },
  webServer: previewUrl
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        env: { E2E_IN_MEMORY_DB: "1" },
        // Locally, reuse a server you already started (fast iteration);
        // in CI always build fresh so the run is reproducible.
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
