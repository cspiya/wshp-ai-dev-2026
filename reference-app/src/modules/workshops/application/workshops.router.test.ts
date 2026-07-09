import { describe, expect, it } from "vitest";

import type { Workshop, WorkshopInput } from "../domain/workshop";
import { createInMemoryWorkshopRepo } from "../infra/in-memory-workshop-repo";
import { createWorkshopsRouter } from "./workshops.router";

/**
 * Router-level contract tests: the real router logic + Zod schemas, with the
 * in-memory test double behind the WorkshopRepo port. No DB, no HTTP — each
 * scenario in acceptance/workshops.feature maps to a test below.
 */

const validInput: WorkshopInput = {
  title: "AI-Assisted Development Workshop",
  description: "One-day hands-on workshop.",
  date: "2026-07-14T09:00:00.000Z",
  location: "Budapest",
  listPriceHuf: 120000,
  capacity: 5,
};

function seeded(overrides: Partial<Workshop> = {}): Workshop {
  return {
    ...validInput,
    id: crypto.randomUUID(),
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCaller(seed: Workshop[] = []) {
  return createWorkshopsRouter(createInMemoryWorkshopRepo(seed)).createCaller({});
}

const missingId = "3f8a2c1e-0000-4000-8000-00000000dead";

describe("workshops router (contract tests over the WorkshopRepo port)", () => {
  it("lists workshops ordered by date ascending", async () => {
    const caller = makeCaller([
      seeded({ title: "Later", date: "2026-09-01T09:00:00.000Z" }),
      seeded({ title: "Sooner", date: "2026-07-14T09:00:00.000Z" }),
    ]);

    const result = await caller.list();

    expect(result.map((w) => w.title)).toEqual(["Sooner", "Later"]);
  });

  it("creates a workshop that then appears in the list", async () => {
    const caller = makeCaller();

    const created = await caller.create(validInput);

    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.title).toBe(validInput.title);
    const list = await caller.list();
    expect(list.map((w) => w.id)).toContain(created.id);
  });

  it("rejects an invalid workshop at the schema boundary", async () => {
    const caller = makeCaller();

    await expect(
      caller.create({ ...validInput, title: "", listPriceHuf: -1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller.list()).toHaveLength(0);
  });

  it("gets a workshop by id", async () => {
    const workshop = seeded();
    const caller = makeCaller([workshop]);

    const result = await caller.getById({ id: workshop.id });

    expect(result.title).toBe(workshop.title);
  });

  it("fails with NOT_FOUND for an unknown id", async () => {
    const caller = makeCaller();

    await expect(caller.getById({ id: missingId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("updates a workshop", async () => {
    const workshop = seeded({ title: "Draft title" });
    const caller = makeCaller([workshop]);

    await caller.update({ id: workshop.id, data: { ...validInput, title: "Final title" } });

    const fetched = await caller.getById({ id: workshop.id });
    expect(fetched.title).toBe("Final title");
  });

  it("fails with NOT_FOUND when updating a missing workshop", async () => {
    const caller = makeCaller();

    await expect(caller.update({ id: missingId, data: validInput })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes a workshop; deleting again is NOT_FOUND", async () => {
    const workshop = seeded();
    const caller = makeCaller([workshop]);

    await caller.delete({ id: workshop.id });

    expect(await caller.list()).toHaveLength(0);
    await expect(caller.delete({ id: workshop.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
