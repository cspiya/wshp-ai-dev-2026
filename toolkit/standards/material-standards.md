# Canonical material-creation standards — participant template

This is the single checklist used by material makers and material reviewers (teaching
material, workshop notebooks, glossaries, agendas, handouts). Link to this file; do not
copy it into role prompts. It is the material-plane counterpart of
`engineering-standards.md`: adapt the audience and gate placeholders to your project once,
then keep every role aligned.

In this repository the notebook-specific instantiation is
`materials/notebooks/README.md` (writing rules + reviewer checklist); it refines this
template, it does not replace it.

## Audience translation

- [ ] Explain every deep concept in three layers, in this order: plain engineering
      meaning in the participants' language → an analogy from THEIR stack → only then
      the implementation detail in the teaching stack.
- [ ] Link every non-obvious term to the project glossary at first occurrence; add
      missing terms to the glossary instead of explaining them inline twice.
- [ ] Never assume fluency in the teaching stack's idioms; shorthand that needs the
      target stack's mental model is a defect.

## Block discipline

- [ ] Each block/module teaches ONE clear point and states one takeaway sentence.
- [ ] Every decision gets a "why first" structure: the problem → the choice → why this
      → real alternatives and why not those.
- [ ] Every exercise has: goal → steps → done-criterion → typical failure modes.
- [ ] Each block states what it builds on and what capability it adds (a visible arc,
      not isolated topics).

## Credibility

- [ ] No hype: teach method before tools; capabilities are demonstrated, not promised.
- [ ] No invented claims, numbers, stories, or customer examples; mark fictitious
      examples as fictitious.
- [ ] Sample data is lifelike but INVENTED — never request or paste "realistic" data.
- [ ] Public-content hygiene: no client names, pricing, invite links, secrets, or
      personal data (see `engineering-standards.md` → Security).

## Language and form

- [ ] Participant-facing prose in the participants' language; code, prompts, AI
      instructions, and technical artifacts in English.
- [ ] Every artifact builds from the project's canonical template and renders
      standalone (no external dependencies, valid internal links, no leftover template
      placeholders).
- [ ] Visual review in a real browser is part of the definition of done — a structural
      check alone does not prove readability.

## Fallback rule

- [ ] Every live demo has a stated Plan B (recording, local path, or trainer-owned
      environment); a setup step without a fallback is a delivery risk, not a detail.

## Project-specific mechanical gates

This repository's commands (run from the repo root; adapt the list when you
port the checklist to another project):

- Template/placeholder scan: `node toolkit/hooks/check-placeholders.mjs`
- Structural HTML/shell check: `node toolkit/hooks/check-notebooks.mjs`
- Public-content guard: `node toolkit/hooks/check-public-content.mjs`
- Link validity check: `node toolkit/hooks/check-links.mjs`

Each validator scans the tracked repo files by default and accepts explicit
file paths as arguments (useful for checking a single artifact or a fixture).
