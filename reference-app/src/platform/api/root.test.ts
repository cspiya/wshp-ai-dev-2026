import { afterEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/platform/api/root";

describe("health.ping", () => {
  const caller = appRouter.createCaller({});

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
