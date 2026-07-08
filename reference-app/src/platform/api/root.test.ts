import { describe, expect, it } from "vitest";

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
});
