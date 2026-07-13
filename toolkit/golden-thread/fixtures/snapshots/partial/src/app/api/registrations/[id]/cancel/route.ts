// TASK-04 is intentionally unimplemented in this catch-up snapshot: POST must
// cancel an active registration (200 success, 409 window closed, 404 unknown).
// See spec-package/tasks.md for the approved contract.

export async function POST() {
  return Response.json({ error: "not-implemented (TASK-04)" }, { status: 501 });
}
