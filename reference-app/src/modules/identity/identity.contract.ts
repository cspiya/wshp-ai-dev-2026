import { z } from "zod";

/**
 * PUBLIC CONTRACT of the `identity` module.
 * This is the ONLY file other modules may import from `identity`
 * (enforced by ESLint `import/no-restricted-paths` — see eslint.config.mjs).
 * Keep it small: every export here is a promise to the rest of the app.
 */
export const userIdSchema = z.uuid().brand<"UserId">();
export type UserId = z.infer<typeof userIdSchema>;
