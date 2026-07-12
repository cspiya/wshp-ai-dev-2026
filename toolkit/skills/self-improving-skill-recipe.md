# Self-improving skill — recipe

A skill stays useful only if it absorbs what reviews and incidents teach.
This is the minimal loop; `rug-review/SKILL.md` is the worked example.

## The loop

1. **Trigger evidence.** When a skill run produced a wrong or incomplete
   result, capture the concrete case: input, expected, actual — one paragraph,
   invented-data-safe.
2. **Locate the gap.** Decide which single part failed: the `description`
   (skill did not trigger / triggered wrongly), the instructions (triggered
   but did the wrong thing), or a referenced standard (did the "right" thing
   to an outdated bar).
3. **Edit exactly that part.** One failure case = one focused edit. Do not
   rewrite the whole skill around one incident.
4. **Re-run the failing case.** The original input must now produce the
   expected behavior — a skill edit without a re-run is a guess.
5. **Keep it short.** If the skill outgrows one screen, extract stable
   reference material into a linked file and keep the skill as the decision
   layer. Long skills stop being loaded reliably.

## Guardrails

- The skill references the canonical standard
  (`toolkit/standards/engineering-standards.md` or `material-standards.md`);
  it never copies it — otherwise every standard update silently forks.
- Description edits are the highest-risk change (they alter WHEN the skill
  fires): after changing one, test one positive and one negative trigger case.
- Version the change in git with the failure case in the commit message —
  the history of failures IS the skill's test suite.
