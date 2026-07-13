"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Registration } from "@/lib/registrations/domain";
import type { Workshop } from "@/lib/registrations/file-repo";

// Server error codes → Hungarian participant-facing messages.
const ERROR_MESSAGES: Record<string, string> = {
  "name-required": "A név megadása kötelező.",
  "email-invalid": "Érvénytelen e-mail-cím.",
  "duplicate-registration":
    "Erre a műhelyre ezzel az e-mail-címmel már van aktív regisztráció.",
  "cancellation window closed":
    "A lemondási ablak lezárult: a kezdés előtti 48 órában a regisztráció már nem mondható le.",
  "registration not found": "A regisztráció nem található.",
};

function messageFor(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] ?? `Hiba történt: ${errorCode}`;
}

// Deterministic date rendering (no locale/timezone surprises between
// server and client): "2026-08-25 09:00 (UTC)".
function formatStartsAt(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} (UTC)`;
}

const inputClassName =
  "h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function RegistrationPanel({
  workshops,
  initialRegistrations,
}: {
  workshops: Workshop[];
  initialRegistrations: Registration[];
}) {
  // The server page provides the initial list; after each mutation the panel
  // re-fetches from the API, so no on-mount effect is needed.
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workshopId, setWorkshopId] = useState(workshops[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/registrations");
    if (res.ok) setRegistrations((await res.json()) as Registration[]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopId, name, email }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(messageFor(body.error ?? `HTTP ${res.status}`));
        return;
      }
      setName("");
      setEmail("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(messageFor(body.error ?? `HTTP ${res.status}`));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const active = registrations.filter((r) => r.status === "active");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Új regisztráció</CardTitle>
          <CardDescription>
            Minden adat kitalált — használj példaneveket és példa e-mail-címeket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Név
              <input
                className={inputClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Példa Panna"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              E-mail
              <input
                className={inputClassName}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="panna.pelda@example.invalid"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Műhely
              <select
                className={inputClassName}
                value={workshopId}
                onChange={(e) => setWorkshopId(e.target.value)}
              >
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} — {formatStartsAt(w.startsAt)}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" className="w-fit" disabled={busy}>
              Regisztrálok
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Aktív regisztrációk</CardTitle>
          <CardDescription>
            {active.length === 0
              ? "Még nincs aktív regisztráció."
              : `${active.length} aktív regisztráció`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {active.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {r.name} — {r.email}
                </span>
                <span className="text-muted-foreground">
                  Kezdés: {formatStartsAt(r.workshopStartsAt)}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => void cancel(r.id)}
              >
                Lemondás
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
