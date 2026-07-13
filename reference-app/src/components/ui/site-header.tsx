"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/workshops", label: "Workshops" },
  { href: "/shop", label: "Shop journey" },
] as const;

/**
 * Chassis bar (accepted mock `.bar`): wordmark plate with an amber lamp and
 * engraved mono subtitle, primary nav with an amber active underline, and
 * the invented-data proof badge. Presentation only. On narrow screens the
 * nav wraps to its own scrollable row — no extra dependency, 44px targets.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-seam bg-gradient-to-b from-[#1d2028] to-shell text-shell-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-stretch gap-x-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 py-3 pr-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-accent sm:border-r sm:border-seam"
        >
          <span className="lamp" aria-hidden="true" />
          <span className="font-heading text-base leading-tight font-bold tracking-tight">
            Reference Lab
            <small className="mt-0.5 block font-mono text-[10px] font-normal tracking-[0.22em] text-[#8a8f9e] uppercase">
              Workshop console
            </small>
          </span>
        </Link>

        <span className="order-1 my-auto ml-auto rounded border border-shell-accent/45 bg-shell-accent/10 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.18em] text-shell-accent uppercase">
          Invented training data
        </span>

        <nav
          aria-label="Primary"
          className="order-2 w-full overflow-x-auto sm:order-none sm:w-auto"
        >
          <ul className="flex items-stretch">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-accent",
                      active
                        ? "border-shell-accent bg-gradient-to-b from-transparent from-60% to-shell-accent/10 text-white"
                        : "border-transparent text-shell-muted hover:text-shell-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
