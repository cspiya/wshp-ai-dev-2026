import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { HealthCheck } from "./health-check";

// ❌ This would fail the boundary lint (deep import into a module):
// import { userIdSchema } from "@/modules/identity/domain/user";
// ✅ Cross-module imports go through the public contract:
// import { userIdSchema } from "@/modules/identity/identity.contract";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Reference App</CardTitle>
          <CardDescription>
            Greenfield reference project of the Wenova AI-Assisted Development
            Workshop — a modular monolith of vertical slices on Next.js + tRPC +
            Drizzle + Neon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <HealthCheck />
          <p className="text-sm text-muted-foreground">
            Start with <code>AGENTS.md</code>, then copy the golden path in{" "}
            <code>src/modules/workshops/</code> to add a feature module. See it
            live: <Link href="/workshops" className="underline">/workshops</Link>
            {" "}or run the cross-slice flow at{" "}
            <Link href="/shop" className="underline">/shop</Link>.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
