import Link from "next/link";

import { HealthCheck } from "./health-check";

// ❌ This would fail the boundary lint (deep import into a module):
// import { userIdSchema } from "@/modules/identity/domain/user";
// ✅ Cross-module imports go through the public contract:
// import { userIdSchema } from "@/modules/identity/identity.contract";

const PILLARS = [
  {
    no: "01 · Spec",
    title: "Spec before code",
    body: "Every slice starts as a written spec with acceptance criteria; the builder restates them before the first line of code.",
  },
  {
    no: "02 · Gates",
    title: "Gates on every change",
    body: "Typecheck, lint, tests and a production build guard each change. The workshops catalog is the golden-path slice they protect.",
    link: { href: "/workshops", label: "Inspect workshops" },
  },
  {
    no: "03 · Evidence",
    title: "Evidence over claims",
    body: "The shop journey ends in a proof certificate — price, payment authorization and registration status captured from the live flow.",
    link: { href: "/shop", label: "Run the journey" },
  },
] as const;

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
    >
      <p className="crumb">
        <b>REF-LAB/00</b> · Reference workload
      </p>
      <h1 className="mt-2 text-4xl leading-[1.06] font-bold tracking-tight text-balance sm:text-5xl">
        A small webshop,
        <br />
        built to prove the method.
      </h1>
      <p className="lede mt-3">
        Spec-first slices, hard quality gates and independent review produce a
        working checkout journey you can inspect end to end — and repeat.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="mission-heading" className="mod">
          <div className="mod-head">
            <span className="mod-tag" id="mission-heading">
              Mission
            </span>
            <span className="mod-stat">
              <span className="dotlamp dotlamp-amber" aria-hidden="true" />
              Ready
            </span>
          </div>
          <div className="mod-body">
            <p className="max-w-[52ch]">
              Every screen of this console is driven by the real application
              state — pricing, fake payment authorization and registration run
              against the same contracts the tests protect. Reference Lab is a
              deliberately invented training webshop.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/shop" className="keycap min-h-11">
                Start shop journey
              </Link>
              <Link href="/workshops" className="btn-plate min-h-11">
                Inspect workshops
              </Link>
            </div>
          </div>
        </section>

        <HealthCheck />
      </div>

      <section
        aria-label="How this app teaches"
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        {PILLARS.map((pillar) => (
          <article key={pillar.no} className="pillar flex flex-col">
            <p className="font-mono text-[11px] tracking-[0.22em] text-primary-text uppercase">
              {pillar.no}
            </p>
            <h2 className="mt-1.5 text-[1.06rem] font-bold">{pillar.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              {pillar.body}
            </p>
            {"link" in pillar && (
              <Link
                href={pillar.link.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {pillar.link.label}
                <span aria-hidden="true">&nbsp;&rarr;</span>
              </Link>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
