import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ---------------------------------------------------------------------------
// Architecture boundaries (enforced, not aspirational).
//
// `import/no-restricted-paths` works on RESOLVED file paths, so a boundary
// holds no matter how an import is spelled: `@/` alias, `./relative`, or a
// multi-hop `../../..` escape all resolve to the same file and hit the same
// fence. (eslint-plugin-import + its TypeScript resolver ship inside
// eslint-config-next, so this needs no extra dependencies.)
//
// These rules have their own regression tests:
// src/platform/lint-boundaries.test.ts
// ---------------------------------------------------------------------------

// Anchor zone paths to this file's folder (not the process cwd), so the CLI,
// the editor, and the Vitest lint tests all see the same boundaries.
const basePath = fileURLToPath(new URL(".", import.meta.url));

const dirsIn = (relative) =>
  fs
    .readdirSync(new URL(relative, import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

// Zones are derived from the folder tree at lint time: a new module gets the
// same fences the moment its folder is created.
const modules = dirsIn("./src/modules");
const nonModuleAreas = dirsIn("./src")
  .filter((dir) => dir !== "modules")
  .map((dir) => `./src/${dir}`); // app, components, contracts, lib, platform

const boundaryZones = [
  // Rule 1 — a module's ONLY public surface is its `<name>.contract.ts`.
  // target = every src/ area EXCEPT the module itself (intra-module imports stay free).
  ...modules.map((mod) => ({
    target: [
      ...nonModuleAreas,
      ...modules.filter((other) => other !== mod).map((other) => `./src/modules/${other}`),
    ],
    from: `./src/modules/${mod}`,
    except: [`./${mod}.contract.ts`],
    message: `Deep import into the "${mod}" module — import its public ${mod}.contract.ts instead.`,
  })),

  // Rule 2 — domain/ is pure: within src/ it may import only its own domain/.
  // (Package imports are fenced separately below — this zone sees resolved paths.)
  ...modules.map((mod) => ({
    target: `./src/modules/${mod}/domain`,
    from: "./src",
    except: [`./modules/${mod}/domain`],
    message: "`domain` imports nothing outward — keep it pure (types + logic only).",
  })),

  // Rule 3 — only a module's infra/ adapters (and platform itself) may touch the DB.
  {
    target: [
      ...nonModuleAreas.filter((area) => area !== "./src/platform"),
      // ...and everything inside a module except its infra/:
      ...modules.flatMap((mod) =>
        fs
          .readdirSync(new URL(`./src/modules/${mod}`, import.meta.url))
          .filter((entry) => entry !== "infra")
          .map((entry) => `./src/modules/${mod}/${entry}`),
      ),
    ],
    from: "./src/platform/db",
    message: "Only a module's infra/ adapters may import @/platform/db.",
  },
];

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

  {
    files: ["src/**"],
    rules: {
      "import/no-restricted-paths": ["error", { basePath, zones: boundaryZones }],
    },
  },

  // Rule 2, package half — domain/ imports NO packages: no React/Next, no
  // vendor SDKs, no `@/` platform alias. `zod` is the single whitelisted
  // exception (schemas are domain vocabulary). Relative imports pass this
  // rule; the resolved-path zones above police where they land.
  {
    files: ["src/modules/*/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Matches every specifier that is not relative (relative ones
              // start with ".") and is not zod / a zod subpath.
              regex: String.raw`^(?!\.)(?!zod($|/))`,
              message: "`domain` is dependency-free — zod is the only allowed package.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
