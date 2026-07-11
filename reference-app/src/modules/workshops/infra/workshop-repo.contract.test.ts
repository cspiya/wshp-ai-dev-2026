import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { WorkshopRepo } from "../application/workshops.router";
import type { WorkshopInput } from "../domain/workshop";
import { createDrizzleWorkshopRepo } from "./drizzle-workshop-repo";
import { createInMemoryWorkshopRepo } from "./in-memory-workshop-repo";

/**
 * ONE contract suite, every adapter. Whatever implements WorkshopRepo must
 * pass exactly these tests — that is what makes the in-memory double a
 * faithful stand-in for the real adapter instead of a diverging one.
 *
 * - The in-memory double runs ALWAYS (no DB needed).
 * - The Drizzle adapter runs only when TEST_DATABASE_URL is set: point it at
 *   a disposable Neon branch after the Neon setup lands (SETUP-STATUS.md)
 *   and run `npm run test`. CI does not set the variable, so CI skips it for
 *   now. The suite cleans up every row it creates and uses unique titles, so
 *   a shared test database survives it.
 */

const STRICT_UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// Unique per run so parallel runs against a shared DB cannot collide.
const runId = crypto.randomUUID().slice(0, 8);

function genericInput(overrides: Partial<WorkshopInput> = {}): WorkshopInput {
  return {
    title: `Contract Suite ${runId}: Sample Workshop`,
    description: "Generic sample data for tests.",
    date: "2027-01-15T09:00:00.000Z",
    location: "Online",
    listPriceHuf: 99000,
    capacity: 20,
    ...overrides,
  };
}

function describeWorkshopRepoContract(makeRepo: () => WorkshopRepo) {
  let repo: WorkshopRepo;
  const createdIds: string[] = [];

  beforeEach(() => {
    repo = makeRepo();
  });

  afterEach(async () => {
    for (const id of createdIds.splice(0)) {
      await repo.delete(id);
    }
  });

  async function createTracked(input: WorkshopInput) {
    const created = await repo.create(input);
    createdIds.push(created.id);
    return created;
  }

  it("create returns strict UTC ISO timestamps, whatever offset came in", async () => {
    const created = await createTracked(genericInput({ date: "2027-01-15T09:00:00+02:00" }));

    expect(created.date).toBe("2027-01-15T07:00:00.000Z");
    expect(created.createdAt).toMatch(STRICT_UTC_ISO);
  });

  it("lists chronologically when mixed offsets disagree with string order", async () => {
    // 22:00Z sorts BEFORE "23:00…+02:00" as a string, but 23:00+02:00 is
    // 21:00Z — chronologically first. String comparison gets this wrong;
    // epoch comparison (and Postgres) get it right.
    const later = await createTracked(
      genericInput({ title: `Contract Suite ${runId}: Later`, date: "2027-06-01T22:00:00.000Z" }),
    );
    const earlier = await createTracked(
      genericInput({ title: `Contract Suite ${runId}: Earlier`, date: "2027-06-01T23:00:00+02:00" }),
    );

    const ours = (await repo.list()).filter((w) => [later.id, earlier.id].includes(w.id));

    expect(ours.map((w) => w.id)).toEqual([earlier.id, later.id]);
  });

  it("hands out snapshots — mutating a returned row does not change the store", async () => {
    const created = await createTracked(genericInput());

    created.title = "MUTATED";
    const fromList = (await repo.list()).find((w) => w.id === created.id);
    expect(fromList?.title).toBe(genericInput().title);

    fromList!.title = "MUTATED AGAIN";
    const again = (await repo.list()).find((w) => w.id === created.id);
    expect(again?.title).toBe(genericInput().title);
  });

  it("update persists changes and returns the updated, normalized row", async () => {
    const created = await createTracked(genericInput());

    const updated = await repo.update(created.id, {
      ...genericInput({ title: `Contract Suite ${runId}: Renamed` }),
      date: "2027-02-01T10:00:00+01:00",
    });

    expect(updated?.title).toBe(`Contract Suite ${runId}: Renamed`);
    expect(updated?.date).toBe("2027-02-01T09:00:00.000Z");
  });

  it("gets an authoritative snapshot by id and returns null when missing", async () => {
    const created = await createTracked(genericInput());

    const found = await repo.getById(created.id);
    expect(found?.date).toBe(created.date);
    found!.title = "MUTATED";
    expect((await repo.getById(created.id))?.title).toBe(created.title);
    await expect(repo.getById("3f8a2c1e-0000-4000-8000-00000000dead")).resolves.toBeNull();
  });

  it("update returns null for a missing id", async () => {
    expect(await repo.update("3f8a2c1e-0000-4000-8000-00000000dead", genericInput())).toBeNull();
  });

  it("delete removes the row; deleting again reports false", async () => {
    const created = await createTracked(genericInput());

    expect(await repo.delete(created.id)).toBe(true);
    expect((await repo.list()).map((w) => w.id)).not.toContain(created.id);
    expect(await repo.delete(created.id)).toBe(false);
  });
}

describe("WorkshopRepo contract — in-memory double", () => {
  describeWorkshopRepoContract(() => createInMemoryWorkshopRepo());
});

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe.runIf(Boolean(testDatabaseUrl))("WorkshopRepo contract — Drizzle adapter", () => {
  beforeAll(() => {
    // The platform db client reads DATABASE_URL lazily on first query
    // (src/platform/db/client.ts), and vitest isolates module state per test
    // file — pointing it at the test database here affects only this suite.
    process.env.DATABASE_URL = testDatabaseUrl;
  });

  describeWorkshopRepoContract(() => createDrizzleWorkshopRepo());
});
