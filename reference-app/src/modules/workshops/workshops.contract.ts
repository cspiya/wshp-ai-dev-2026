import { createWorkshopsRouter } from "./application/workshops.router";
import { createWorkshopRepo } from "./infra/workshop-repo";

/**
 * PUBLIC CONTRACT of the `workshops` module.
 * This is the ONLY file other modules (and src/app) may import from
 * `workshops` (enforced by ESLint `import/no-restricted-paths` — see
 * eslint.config.mjs). Keep it small: every export here is a promise
 * to the rest of the app.
 */

// Entity schemas + types — the module's shared vocabulary.
export {
  workshopInputSchema,
  workshopSchema,
  type Workshop,
  type WorkshopInput,
} from "./domain/workshop";

// The composed router — mounted in src/platform/api/root.ts.
export const workshopsRouter = createWorkshopsRouter(createWorkshopRepo());

// The slice's UI entry — rendered by src/app/workshops/page.tsx.
export { WorkshopsView } from "./ui/workshops-view";
