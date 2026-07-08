import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // --- Architecture boundary rules (enforced, not aspirational) ---
  // Convention: inside a module use RELATIVE imports; the `@/` alias is for
  // crossing boundaries. The rules below key off that convention.
  //
  // ❌ import { users } from "@/modules/identity/infra/schema";
  // ✅ import { userIdSchema } from "@/modules/identity/identity.contract";
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // A module's ONLY public surface is its `<name>.contract.ts`.
              // (A bare `@/modules/<name>` import already fails TS resolution:
              // modules have no index file, by design.)
              group: ["@/modules/*/*", "!@/modules/*/*.contract"],
              message:
                "Deep import into a module. Import its public `*.contract.ts` instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // `domain/` is pure: it imports nothing outward — no platform, no other
    // modules, no React/Next. Pure TS types + logic only.
    files: ["src/modules/*/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/*",
                "../application/*",
                "../infra/*",
                "../ui/*",
                "react",
                "react/*",
                "next",
                "next/*",
              ],
              message: "`domain` imports nothing outward — keep it pure.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
