import { describe, expect, it } from "vitest";

import { createInMemoryRegistrationRepo } from "../infra/in-memory-registration-repo";
import { createRegistrationsRouter } from "./registrations.router";

const input = {
  workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
  participantName: "Sample Participant",
  participantEmail: "sample@example.test",
};
const fixedNow = () => new Date("2027-01-01T10:00:00.000Z");
const schedule = {
  getStartsAt: async (workshopId: string) =>
    workshopId === input.workshopId ? "2027-01-10T10:00:00.000Z" : null,
};

function caller() {
  return createRegistrationsRouter(createInMemoryRegistrationRepo(), schedule, fixedNow).createCaller({ userId: "test-user" });
}

describe("registrations router", () => {
  it("creates pending and confirms it", async () => {
    const api = caller();
    const created = await api.create(input);
    expect(created.status).toBe("pending");
    await expect(api.confirm({ id: created.id })).resolves.toMatchObject({ status: "confirmed" });
  });

  it("persists only the authoritative server-owned workshop start", async () => {
    const api = caller();
    const created = await api.create(input);
    expect(created.workshopStartsAt).toBe("2027-01-10T10:00:00.000Z");

    await expect(
      api.create({ ...input, workshopStartsAt: "2099-01-01T00:00:00.000Z" } as typeof input),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a registration for an unknown workshop", async () => {
    const api = caller();
    await expect(
      api.create({ ...input, workshopId: "3f8a2c1e-0000-4000-8000-00000000dead" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("cancels before the deadline using the injected clock", async () => {
    const api = caller();
    const created = await api.create(input);
    await expect(api.cancel({ id: created.id })).resolves.toMatchObject({
      status: "cancelled",
      cancelledAt: "2027-01-01T10:00:00.000Z",
    });
  });

  it("rejects late cancellation without changing status", async () => {
    const repo = createInMemoryRegistrationRepo();
    const api = createRegistrationsRouter(
      repo,
      schedule,
      () => new Date("2027-01-09T10:00:00.001Z"),
    ).createCaller({ userId: "test-user" });
    const created = await api.create(input);
    await expect(api.cancel({ id: created.id })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect((await repo.getById(created.id))?.status).toBe("pending");
  });

  it("rejects confirming an already confirmed registration", async () => {
    const api = caller();
    const created = await api.create(input);
    await api.confirm({ id: created.id });
    await expect(api.confirm({ id: created.id })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("allows exactly one of two concurrent confirmations", async () => {
    const api = caller();
    const created = await api.create(input);

    const results = await Promise.allSettled([
      api.confirm({ id: created.id }),
      api.confirm({ id: created.id }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("rejects every write without a session, but keeps the list public", async () => {
    const anonymous = createRegistrationsRouter(
      createInMemoryRegistrationRepo(),
      schedule,
      fixedNow,
    ).createCaller({ userId: null });

    await expect(anonymous.create(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.confirm({ id: crypto.randomUUID() })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(anonymous.cancel({ id: crypto.randomUUID() })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(anonymous.list()).resolves.toEqual([]);
  });
});

it("uses the configured window in both the rule and the error message", async () => {
  const dayWindowMs = 24 * 60 * 60 * 1_000;
  const api = createRegistrationsRouter(
    createInMemoryRegistrationRepo(),
    schedule,
    // workshop starts 2027-01-10T10:00Z; 30h before start = inside a 48h
    // window but OUTSIDE a 24h window, so cancellation must be allowed here.
    () => new Date("2027-01-09T04:00:00.000Z"),
    dayWindowMs,
  ).createCaller({});
  const created = await api.create(input);
  await expect(api.cancel({ id: created.id })).resolves.toMatchObject({ status: "cancelled" });

  const lateApi = createRegistrationsRouter(
    createInMemoryRegistrationRepo(),
    schedule,
    // 23h before start: inside the 24h window -> rejected, message names 24 hours.
    () => new Date("2027-01-09T11:00:00.000Z"),
    dayWindowMs,
  ).createCaller({});
  const late = await lateApi.create(input);
  await expect(lateApi.cancel({ id: late.id })).rejects.toMatchObject({
    message: expect.stringContaining("24 hours"),
  });
});
