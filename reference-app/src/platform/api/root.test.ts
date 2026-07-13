import { afterEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/platform/api/root";

describe("health.ping", () => {
  const caller = appRouter.createCaller({ userId: "test-user" });

  it("answers pong without input", async () => {
    const result = await caller.health.ping();
    expect(result.ok).toBe(true);
    expect(result.message).toBe("pong");
  });

  it("greets by name when input is given", async () => {
    const result = await caller.health.ping({ name: "workshop" });
    expect(result.message).toBe("pong, workshop");
  });

  it("rejects an empty name at the schema boundary", async () => {
    await expect(caller.health.ping({ name: "" })).rejects.toThrow();
  });
});

describe("orders wiring", () => {
  // GUEST context on purpose: the webshop procedures must work without a
  // session — this pins the composition root's wiring AND the public access.
  const guest = appRouter.createCaller({ userId: null });

  it("serves a guest order preview through the composition root", async () => {
    const totals = await guest.orders.preview({
      items: [
        {
          workshopId: "3f8a2c1e-0000-4000-8000-000000000001",
          title: "Sample Workshop: Checkout Flow",
          unitNetHuf: 38_500,
          quantity: 1,
        },
      ],
      couponCode: "WELCOME10",
    });
    expect(totals).toMatchObject({
      netSubtotalHuf: 38_500,
      discountHuf: 3_850,
      vatHuf: 9_356,
      grossHuf: 44_006,
    });
  });
});

describe("composition root guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("refuses to start when E2E_IN_MEMORY_DB is set on Vercel", async () => {
    vi.stubEnv("E2E_IN_MEMORY_DB", "1");
    vi.stubEnv("VERCEL", "1");
    vi.resetModules();

    await expect(import("@/platform/api/root")).rejects.toThrow(/local-e2e-only/);
  });
});
