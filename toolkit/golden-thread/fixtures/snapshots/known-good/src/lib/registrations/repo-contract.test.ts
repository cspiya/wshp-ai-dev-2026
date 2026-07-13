import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Registration } from "./domain";
import type { RegistrationRepo } from "./repo";
import { FileRegistrationRepo } from "./file-repo";
import { MemoryRegistrationRepo } from "./memory-repo";

// ONE shared contract suite, run against BOTH adapters. If a behavior drifts
// between the in-memory test double and the real file adapter, this suite —
// not production — is where it surfaces.

function inventedRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    id: "reg-contract-0001",
    workshopId: "ws-2026-08-alap",
    workshopStartsAt: "2026-08-25T09:00:00.000Z",
    name: "Példa Panna",
    email: "panna.pelda@example.invalid",
    status: "active",
    registeredAt: "2026-07-01T08:30:00.000Z",
    cancelledAt: null,
    ...overrides,
  };
}

interface AdapterCase {
  name: string;
  make: () => Promise<{ repo: RegistrationRepo; cleanup: () => Promise<void> }>;
}

const adapters: AdapterCase[] = [
  {
    name: "MemoryRegistrationRepo",
    make: async () => ({ repo: new MemoryRegistrationRepo(), cleanup: async () => {} }),
  },
  {
    name: "FileRegistrationRepo",
    make: async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "kk-reg-contract-"));
      return {
        repo: new FileRegistrationRepo(dir),
        cleanup: () => rm(dir, { recursive: true, force: true }),
      };
    },
  },
];

async function withRepo(
  adapter: AdapterCase,
  run: (repo: RegistrationRepo) => Promise<void>,
): Promise<void> {
  const { repo, cleanup } = await adapter.make();
  try {
    await run(repo);
  } finally {
    await cleanup();
  }
}

for (const adapter of adapters) {
  describe(`RegistrationRepo contract — ${adapter.name}`, () => {
    it("starts empty and lists what was created", async () => {
      await withRepo(adapter, async (repo) => {
        expect(await repo.list()).toEqual([]);
        const row = inventedRegistration();
        await repo.create(row);
        expect(await repo.list()).toEqual([row]);
      });
    });

    it("findActiveByEmail matches only the active email+workshop pair", async () => {
      await withRepo(adapter, async (repo) => {
        const row = inventedRegistration();
        await repo.create(row);
        expect(await repo.findActiveByEmail(row.email, row.workshopId)).toEqual(row);
        expect(await repo.findActiveByEmail(row.email, "ws-other")).toBeNull();
        expect(await repo.findActiveByEmail("nincs.ilyen@example.invalid", row.workshopId)).toBeNull();
      });
    });

    it("cancel marks the active row cancelled and returns the updated row", async () => {
      await withRepo(adapter, async (repo) => {
        const row = inventedRegistration();
        await repo.create(row);
        const cancelled = await repo.cancel(row.id, "2026-07-05T12:00:00.000Z");
        expect(cancelled).toMatchObject({
          id: row.id,
          status: "cancelled",
          cancelledAt: "2026-07-05T12:00:00.000Z",
        });
        // A cancelled row no longer counts as an active duplicate.
        expect(await repo.findActiveByEmail(row.email, row.workshopId)).toBeNull();
      });
    });

    it("cancel returns null for unknown or already-cancelled ids", async () => {
      await withRepo(adapter, async (repo) => {
        expect(await repo.cancel("reg-unknown", "2026-07-05T12:00:00.000Z")).toBeNull();
        const row = inventedRegistration();
        await repo.create(row);
        await repo.cancel(row.id, "2026-07-05T12:00:00.000Z");
        expect(await repo.cancel(row.id, "2026-07-06T12:00:00.000Z")).toBeNull();
      });
    });
  });
}
