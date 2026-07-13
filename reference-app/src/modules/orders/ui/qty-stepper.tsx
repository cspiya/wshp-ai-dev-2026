"use client";

import { MAX_SEATS_PER_WORKSHOP } from "../domain/order";

/**
 * Seat quantity stepper (accepted mock `.qty`): minus / value / plus,
 * clamped to 1..MAX_SEATS_PER_WORKSHOP. The buttons are the only way to
 * change the value — no free typing, so an out-of-range quantity cannot
 * even be expressed here (the domain still enforces the cap server-side).
 */
export function QtyStepper({
  value,
  onChange,
  label,
  testId,
}: {
  value: number;
  onChange: (next: number) => void;
  /** Accessible subject, e.g. "seats" or `seats for ${title}`. */
  label: string;
  testId?: string;
}) {
  return (
    <span className="qty">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        &minus;
      </button>
      <output aria-label={label} className="qty-val" data-testid={testId}>
        {value}
      </output>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(MAX_SEATS_PER_WORKSHOP, value + 1))}
        disabled={value >= MAX_SEATS_PER_WORKSHOP}
      >
        +
      </button>
    </span>
  );
}
