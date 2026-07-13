import { cn } from "@/lib/utils";

/**
 * Tiny inline status glyphs (presentation only, no icon dependency).
 * Always paired with visible text — never the sole carrier of meaning.
 */

type GlyphProps = { className?: string };

const base = "inline-block size-3.5 shrink-0";

export function CheckGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(base, className)}
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export function WarnGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(base, className)}
    >
      <path d="M8 1.8 15 14H1L8 1.8Z" />
      <path d="M8 6.2v3.6" />
      <path d="M8 11.9v.1" strokeWidth="2" />
    </svg>
  );
}

export function DashGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2.5 2.5"
      aria-hidden="true"
      className={cn(base, className)}
    >
      <circle cx="8" cy="8" r="6.2" />
    </svg>
  );
}

export function LockGlyph({ className }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(base, className)}
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
