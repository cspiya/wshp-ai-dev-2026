import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";

import { getDb } from "@/platform/db/client";

import type { RegistrationRepo } from "../application/registrations.router";
import type { RegistrationRecordInput } from "../domain/registration";
import { createDrizzleRegistrationRepo } from "./drizzle-registration-repo";
import { createInMemoryRegistrationRepo } from "./in-memory-registration-repo";
import { registrations } from "./schema";

const input: RegistrationRecordInput = {
  workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
  participantName: "Contract Sample",
  participantEmail: `contract-${crypto.randomUUID()}@example.test`,
  workshopStartsAt: "2027-03-10T12:00:00+02:00",
};

function registrationRepoContract(
  makeRepo: () => RegistrationRepo,
  cleanup: (ids: string[]) => Promise<void> = async () => undefined,
) {
  let repo: RegistrationRepo;
  const createdIds: string[] = [];

  beforeEach(() => {
    repo = makeRepo();
  });
  afterEach(async () => {
    await cleanup(createdIds.splice(0));
  });

  it("creates a normalized pending snapshot and retrieves it by id", async () => {
    const created = await repo.create(input);
    createdIds.push(created.id);
    expect(created).toMatchObject({ status: "pending", workshopStartsAt: "2027-03-10T10:00:00.000Z" });
    created.participantName = "MUTATED";
    expect((await repo.getById(created.id))?.participantName).toBe("Contract Sample");
  });

  it("updates status and cancellation timestamp", async () => {
    const created = await repo.create(input);
    createdIds.push(created.id);
    const updated = await repo.transitionStatus(
      created.id,
      ["pending"],
      "cancelled",
      "2027-01-01T10:00:00.000Z",
    );
    expect(updated).toMatchObject({ status: "cancelled", cancelledAt: "2027-01-01T10:00:00.000Z" });
  });

  it("returns null for missing ids", async () => {
    const id = "3f8a2c1e-0000-4000-8000-00000000dead";
    await expect(repo.getById(id)).resolves.toBeNull();
    await expect(repo.transitionStatus(id, ["pending"], "confirmed", null)).resolves.toBeNull();
  });

  it("atomically transitions only from an expected current status", async () => {
    const created = await repo.create(input);
    createdIds.push(created.id);

    const [first, second] = await Promise.all([
      repo.transitionStatus(created.id, ["pending"], "confirmed", null),
      repo.transitionStatus(created.id, ["pending"], "confirmed", null),
    ]);

    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect((await repo.getById(created.id))?.status).toBe("confirmed");
  });
}

describe("RegistrationRepo contract — in-memory double", () => {
  registrationRepoContract(() => createInMemoryRegistrationRepo());
});

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
describe.runIf(Boolean(testDatabaseUrl))("RegistrationRepo contract — Drizzle adapter", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = testDatabaseUrl;
  });
  registrationRepoContract(
    () => createDrizzleRegistrationRepo(),
    async (ids) => {
      if (ids.length > 0) {
        await getDb().delete(registrations).where(inArray(registrations.id, ids));
      }
    },
  );
});
