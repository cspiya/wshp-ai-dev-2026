"use client";

import { Badge } from "@/components/ui/badge";
import { trpc } from "@/platform/api/client";

/**
 * Proof of end-to-end wiring: React → TanStack Query → tRPC → Zod → server.
 * The types flow from the server router into this component with no codegen.
 */
export function HealthCheck() {
  const ping = trpc.health.ping.useQuery({ name: "workshop" });

  if (ping.isPending) return <Badge variant="outline">checking…</Badge>;
  if (ping.isError) return <Badge variant="destructive">API unreachable</Badge>;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge>API ok</Badge>
      <span className="text-muted-foreground">
        {ping.data.message} · {ping.data.time}
      </span>
    </div>
  );
}
