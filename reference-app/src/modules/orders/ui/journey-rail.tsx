import { CheckGlyph, LockGlyph } from "@/components/ui/glyphs";
import { cn } from "@/lib/utils";

export type JourneyStepState = "completed" | "current" | "locked";

export type JourneyStep = {
  index: string;
  label: string;
  state: JourneyStepState;
  /** Mono status word shown under the label (DONE / CHOOSE / LOCKED / …). */
  note: string;
  /** For locked stations: WHY the station is locked (visible text). */
  lockedReason?: string;
};

/**
 * Calibration rail (accepted mock `.rail`/`.station`): stations over a
 * ruler-tick strip. Meaning survives color-blindness — every state pairs the
 * lamp with an icon and a mono status word, and locked stations state WHY
 * they are locked. Presentation only; the parent derives every state from
 * real query/mutation state. Two adjacent stations may both be "current"
 * (the checkout screen works both the details and the billing station);
 * `aria-current="step"` then goes to the FIRST of them only.
 */
export function JourneyRail({ steps, className }: { steps: JourneyStep[]; className?: string }) {
  const firstCurrent = steps.findIndex((step) => step.state === "current");
  return (
    <ol aria-label="Shop journey steps" className={cn("rail mt-7", className)}>
      {steps.map((step, index) => (
        <li
          key={step.index}
          aria-current={step.state === "current" && index === firstCurrent ? "step" : undefined}
          className={cn(
            "station",
            step.state === "completed" && "station-done",
            step.state === "current" && "station-now",
            step.state === "locked" && "station-lock",
          )}
        >
          <span className="station-lampline" aria-hidden="true">
            <span className="dotlamp" />
          </span>
          <span className="station-idx">{step.index}</span>
          <span className="station-nm">
            {step.state === "completed" && <CheckGlyph className="text-success" />}
            {step.state === "locked" && <LockGlyph />}
            {step.label}
          </span>
          <span className="station-st">
            {step.note}
            {step.state === "locked" && step.lockedReason && (
              <> · {step.lockedReason}</>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
