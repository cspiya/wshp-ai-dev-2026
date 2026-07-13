import { canCancel } from "@/lib/registrations/domain";
import { FileRegistrationRepo } from "@/lib/registrations/file-repo";

// Composition root for the API: concrete adapter wired here.
const repo = new FileRegistrationRepo();

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const registration = (await repo.list()).find(
    (row) => row.id === id && row.status === "active",
  );
  if (!registration) {
    return Response.json({ error: "registration not found" }, { status: 404 });
  }

  // AC-02: the UI/API uses the real clock; the boundary rule itself lives in
  // the domain and is tested with an injected clock.
  if (!canCancel(new Date(), new Date(registration.workshopStartsAt))) {
    return Response.json({ error: "cancellation window closed" }, { status: 409 });
  }

  const cancelled = await repo.cancel(id, new Date().toISOString());
  if (!cancelled) {
    return Response.json({ error: "registration not found" }, { status: 404 });
  }
  return Response.json(cancelled);
}
