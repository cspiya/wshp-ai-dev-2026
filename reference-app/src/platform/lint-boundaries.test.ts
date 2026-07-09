import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Regression tests for the architecture boundary rules in eslint.config.mjs.
 * Lint rules are code too: every bypass found in review becomes a fixture
 * here, so a config refactor cannot silently reopen a hole.
 *
 * Fixtures are linted as virtual files (ESLint's Node API + lintText), so
 * nothing on disk changes — except a temporary empty `billing` module folder,
 * created so the config's module discovery sees a second (sibling) module.
 */

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const fakeModuleDir = path.join(rootDir, "src/modules/billing/ui");

const BOUNDARY_RULES = ["import/no-restricted-paths", "no-restricted-imports"];
const TIMEOUT = 30_000;

let eslint: ESLint;

beforeAll(() => {
  // The config reads src/modules/ from disk when it loads, so the fake
  // sibling module must exist before the first lint call.
  fs.mkdirSync(fakeModuleDir, { recursive: true });
  eslint = new ESLint({ cwd: rootDir });
});

afterAll(() => {
  fs.rmSync(path.join(rootDir, "src/modules/billing"), { recursive: true, force: true });
});

/** Lints a virtual file and returns only the boundary-rule error messages. */
async function boundaryErrors(virtualPath: string, code: string) {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(rootDir, virtualPath),
  });
  return result.messages.filter((m) => m.ruleId && BOUNDARY_RULES.includes(m.ruleId));
}

describe("architecture boundary lint rules", () => {
  describe("violations are reported", () => {
    it(
      "cross-module deep import, spelled relative, from a sibling module",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/billing/ui/page.tsx",
          `import { placeholder } from "../../identity/infra/schema";\nexport const use = placeholder;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "cross-module deep import, spelled with the @/ alias, from app/",
      async () => {
        const errors = await boundaryErrors(
          "src/app/fixture.tsx",
          `import { placeholder } from "@/modules/identity/infra/schema";\nexport const use = placeholder;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "domain escaping to platform via a multi-hop relative path",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/domain/rule.ts",
          `import { env } from "../../../platform/env";\nexport const use = env;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "domain escaping from a subfolder (extra ../ hop)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/domain/policies/rule.ts",
          `import { env } from "../../../../platform/env";\nexport const use = env;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "domain importing a vendor package (drizzle-orm)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/domain/user.ts",
          `import { pgTable } from "drizzle-orm/pg-core";\nexport const use = pgTable;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "scripts/ deep-importing module internals (runners are fenced like src/)",
      async () => {
        const errors = await boundaryErrors(
          "scripts/fixture.ts",
          `import { placeholder } from "../src/modules/identity/infra/schema";\nexport const use = placeholder;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "e2e/ deep-importing module internals (specs are fenced like src/)",
      async () => {
        const errors = await boundaryErrors(
          "e2e/fixture.spec.ts",
          `import { placeholder } from "@/modules/identity/infra/schema";\nexport const use = placeholder;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "e2e/ importing the db client (specs drive the browser, not the db)",
      async () => {
        const errors = await boundaryErrors(
          "e2e/fixture.spec.ts",
          `import { getDb } from "@/platform/db/client";\nexport const use = getDb;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "ui importing the db client (@/platform/db is infra-only)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/ui/widget.tsx",
          `import { getDb } from "@/platform/db/client";\nexport const use = getDb;\n`,
        );
        expect(errors).not.toHaveLength(0);
      },
      TIMEOUT,
    );
  });

  describe("legal imports pass", () => {
    it(
      "importing a module's public contract (alias, from app/)",
      async () => {
        const errors = await boundaryErrors(
          "src/app/fixture.tsx",
          `import { userIdSchema } from "@/modules/identity/identity.contract";\nexport const use = userIdSchema;\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "importing a module's public contract (relative, from a sibling module)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/billing/ui/page.tsx",
          `import { userIdSchema } from "../../identity/identity.contract";\nexport const use = userIdSchema;\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "intra-module relative import (infra importing its own schema)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/infra/repo.ts",
          `import "./schema";\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "infra importing the db client (the one allowed db consumer)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/infra/repo.ts",
          `import { getDb } from "@/platform/db/client";\nexport const use = getDb;\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "scripts/ importing a module's public contract",
      async () => {
        const errors = await boundaryErrors(
          "scripts/fixture.ts",
          `import { userIdSchema } from "@/modules/identity/identity.contract";\nexport const use = userIdSchema;\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "scripts/ importing the db client (thin runners are composition roots)",
      async () => {
        const errors = await boundaryErrors(
          "scripts/fixture.ts",
          `import { getDb } from "@/platform/db/client";\nexport const use = getDb;\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );

    it(
      "domain importing zod (the whitelisted package)",
      async () => {
        const errors = await boundaryErrors(
          "src/modules/identity/domain/user.ts",
          `import { z } from "zod";\nexport const userName = z.string().min(1);\n`,
        );
        expect(errors).toHaveLength(0);
      },
      TIMEOUT,
    );
  });
});
