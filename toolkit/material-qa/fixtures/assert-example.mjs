// Example adapter module for --assert (WEN-214/WEN-216 integration point).
// The real accessibility/static-fallback assertions land with those specs;
// this file only demonstrates and tests the contract.
export async function assertPage({ page, failures }) {
  const title = await page.title();
  if (!title || title.trim().length === 0) {
    failures.push({ kind: 'assert', detail: 'document has no <title>' });
  }
}
