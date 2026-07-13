// TASK-04 is intentionally unimplemented in this catch-up snapshot: GET must
// list registrations, POST must create one (400 invalid, 409 duplicate).
// See spec-package/tasks.md for the approved contract.

export async function GET() {
  return Response.json({ error: "not-implemented (TASK-04)" }, { status: 501 });
}

export async function POST() {
  return Response.json({ error: "not-implemented (TASK-04)" }, { status: 501 });
}
