import { createRegistration } from "@/lib/registrations/domain";
import { FileRegistrationRepo, readWorkshops } from "@/lib/registrations/file-repo";

// Composition root for the API: the concrete file adapter is wired HERE,
// never inside the domain module.
const repo = new FileRegistrationRepo();

export async function GET() {
  return Response.json(await repo.list());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }
  const input = body as { workshopId?: unknown; name?: unknown; email?: unknown };
  if (
    typeof input.workshopId !== "string" ||
    typeof input.name !== "string" ||
    typeof input.email !== "string"
  ) {
    return Response.json(
      { error: "workshopId, name and email are required" },
      { status: 400 },
    );
  }

  const workshop = (await readWorkshops()).find((w) => w.id === input.workshopId);
  if (!workshop) {
    return Response.json({ error: "unknown-workshop" }, { status: 400 });
  }

  // Resolve the duplicate check against storage, then let the pure domain decide.
  const existing = await repo.findActiveByEmail(
    input.email.trim().toLowerCase(),
    workshop.id,
  );
  const result = createRegistration(
    {
      workshopId: workshop.id,
      workshopStartsAt: workshop.startsAt,
      name: input.name,
      email: input.email,
    },
    {
      id: crypto.randomUUID(),
      now: new Date(),
      hasActiveRegistration: () => existing !== null,
    },
  );

  if (!result.ok) {
    const status = result.error === "duplicate-registration" ? 409 : 400;
    return Response.json({ error: result.error }, { status });
  }

  await repo.create(result.registration);
  return Response.json(result.registration, { status: 201 });
}
