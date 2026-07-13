"use client";

import { DashGlyph, WarnGlyph } from "@/components/ui/glyphs";
import { trpc } from "@/platform/api/client";

/**
 * Proof of end-to-end wiring: React → TanStack Query → tRPC → Zod → server.
 * The types flow from the server router into this component with no codegen.
 *
 * Presented as an instrument module (accepted mock "System health"): the
 * header lamp mirrors the REAL query state and always pairs with a text
 * state — status is never communicated by color alone. Nothing here claims
 * anything the ping response does not contain.
 */
export function HealthCheck() {
  const ping = trpc.health.ping.useQuery({ name: "workshop" });

  const stat = ping.isPending
    ? { lamp: "dotlamp", text: "Checking" }
    : ping.isError
      ? { lamp: "dotlamp dotlamp-bad", text: "Fail" }
      : { lamp: "dotlamp dotlamp-ok", text: "Pass" };

  return (
    <section aria-labelledby="health-heading" className="mod">
      <div className="mod-head">
        <span className="mod-tag" id="health-heading">
          System health
        </span>
        <span className="mod-stat">
          <span className={stat.lamp} aria-hidden="true" />
          {stat.text}
        </span>
      </div>
      <div className="mod-body grid gap-3.5">
        {ping.isPending && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <DashGlyph className="motion-safe:animate-spin [animation-duration:3s]" />
            Checking the API…
          </p>
        )}
        {ping.isError && (
          <div role="alert">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
              <WarnGlyph />
              API unreachable
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{ping.error.message}</p>
          </div>
        )}
        {ping.isSuccess && (
          <p className="healthline">
            <span className="lamp" aria-hidden="true" />
            API responding{" "}
            <code className="font-mono text-[0.78rem] text-muted-foreground">
              {ping.data.message}
            </code>
          </p>
        )}
        <div className="read">
          <span className="read-k">Transport</span>
          <span className="read-v">tRPC / React Query</span>
        </div>
        <div className="read">
          <span className="read-k">Last check</span>
          <span className="read-v">{ping.data ? ping.data.time : "—"}</span>
        </div>
      </div>
    </section>
  );
}
