/**
 * PUBLIC CONTRACT of the `workshops` module.
 * This is the ONLY file other modules (and src/app, src/platform, scripts,
 * e2e) may import from `workshops` (enforced by ESLint
 * `import/no-restricted-paths` — see eslint.config.mjs). Keep it small:
 * every export here is a promise to the rest of the app. Exports are added
 * when a consumer appears, never "for later" — the entity schemas, for
 * example, stay internal until another module actually needs them.
 */

// The use-cases as a router FACTORY. The module does NOT compose itself:
// the composition root (src/platform/api/root.ts) picks a repo adapter and
// injects it. Composing here (at import time) would hard-wire the adapter
// choice and drag infra dependencies into every importer of this file.
export { createWorkshopsRouter } from "./application/workshops.router";

// The repo adapters the composition root can choose from.
export { createDrizzleWorkshopRepo } from "./infra/drizzle-workshop-repo";
export { createInMemoryWorkshopRepo } from "./infra/in-memory-workshop-repo";

// Demo data seeding — consumed by the thin runner scripts/seed.ts.
export { seedDemoWorkshops } from "./infra/seed";

// The slice's UI entry — rendered by src/app/workshops/page.tsx.
export { WorkshopsView } from "./ui/workshops-view";
