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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // GUEST context on purpose: the webshop procedures must work without a
  // session — this pins the composition root's wiring AND the public access.
  // The local-e2e seam supplies the seeded in-memory catalog, because the
  // preview now PRICES every line through the injected workshop source: the
  // client sends only id + quantity, the totals below derive from the
  // seeded 10 000 HUF list price.
  it("serves a guest order preview priced from the catalog", async () => {
    vi.stubEnv("E2E_IN_MEMORY_DB", "1");
    vi.resetModules();
    const { appRouter: seededRouter } = await import("@/platform/api/root");
    const guest = seededRouter.createCaller({ userId: null });

    const totals = await guest.orders.preview({
      items: [{ workshopId: "3f8a2c1e-0000-4000-8000-000000000001", quantity: 2 }],
      couponCode: "WELCOME10",
    });
    // 2 × 10 000 = 20 000 net → −2 000 → 18 000 → VAT 4 860 → gross 22 860.
    expect(totals).toMatchObject({
      netSubtotalHuf: 20_000,
      discountHuf: 2_000,
      vatHuf: 4_860,
      grossHuf: 22_860,
    });
  });

  it("rejects a workshop id the catalog does not know", async () => {
    vi.stubEnv("E2E_IN_MEMORY_DB", "1");
    vi.resetModules();
    const { appRouter: seededRouter } = await import("@/platform/api/root");
    const guest = seededRouter.createCaller({ userId: null });

    await expect(
      guest.orders.preview({
        items: [{ workshopId: "3f8a2c1e-0000-4000-8000-00000000dead", quantity: 1 }],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("3f8a2c1e-0000-4000-8000-00000000dead"),
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
