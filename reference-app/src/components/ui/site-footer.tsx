/**
 * Ink proof strip (accepted mock `footer.strip`): links the app to the
 * method that built it. Plain text with relative repo references only —
 * no private URLs.
 */
const STRIP_ITEMS = [
  { label: "Golden path", value: "src/modules/workshops" },
  { label: "Gates", value: "typecheck · lint · test · build" },
  { label: "Review", value: "RUG" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-seam bg-shell">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-8 gap-y-1 px-4 py-3.5 font-mono text-[11px] tracking-[0.16em] text-[#8a8f9e] sm:px-6">
        {STRIP_ITEMS.map((item) => (
          <span key={item.label}>
            <b className="font-medium text-[#cdd2de] uppercase">{item.label}</b>{" "}
            {item.value}
          </span>
        ))}
      </div>
    </footer>
  );
}
