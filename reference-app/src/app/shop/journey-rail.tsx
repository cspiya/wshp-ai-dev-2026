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
 * Calibration rail (accepted mock `.rail`/`.station`): four stations over a
 * ruler-tick strip. Meaning survives color-blindness — every state pairs the
 * lamp with an icon and a mono status word, and locked stations state WHY
 * they are locked. Presentation only; the parent derives every state from
 * real query/mutation state.
 */
export function JourneyRail({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol aria-label="Shop journey steps" className="rail mt-7">
      {steps.map((step) => (
        <li
          key={step.index}
          aria-current={step.state === "current" ? "step" : undefined}
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
