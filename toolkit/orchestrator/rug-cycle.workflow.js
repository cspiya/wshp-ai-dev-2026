// Lean teachable RUG orchestrator — the executable form of README.md's
// contract. Copy into .claude/workflows/ (Claude Code) or run via the
// Workflow tool with {scriptPath}. Author and reviewers are SEPARATE
// agent contexts; every prompt LINKS the canonical standard and the role
// prompt files instead of copying them (standards-injection pattern).
//
// args: {
//   task: "one-sentence change request",
//   criteria: ["acceptance criterion", ...],
//   scope: "bounded file scope, e.g. reference-app/src/modules/registrations/**",
//   gates: "exact command(s) that must pass, e.g. npm --prefix reference-app run test"
// }
export const meta = {
  name: 'rug-cycle',
  description: 'Spec -> builder -> independent fresh-context review -> verified fix -> evidence',
  phases: [
    { title: 'Build', detail: 'maker implements against acceptance criteria' },
    { title: 'Review', detail: 'fresh-context reviewers, distinct risk lenses' },
    { title: 'Verify', detail: 'every finding is a claim to test' },
    { title: 'Fix', detail: 'bounce back only verified findings' },
  ],
}

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'severity', 'evidence'],
        properties: {
          title: { type: 'string' },
          severity: { enum: ['blocking', 'important', 'minor'] },
          evidence: { type: 'string' },
          verifyHow: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['accepted', 'reason'],
  properties: { accepted: { type: 'boolean' }, reason: { type: 'string' } },
}

const BUILD_RESULT = {
  type: 'object',
  required: ['summary', 'changedFiles', 'gateOutput'],
  properties: {
    summary: { type: 'string' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    gateOutput: { type: 'string' },
  },
}

// Robustness: some launchers deliver args as a JSON string.
const input = typeof args === 'string' ? JSON.parse(args) : args
const { task, criteria, scope, gates } = input
const spec = [
  `TASK: ${task}`,
  `ACCEPTANCE CRITERIA:\n- ${criteria.join('\n- ')}`,
  `SCOPE (do not touch anything outside): ${scope}`,
  `MECHANICAL GATES (must pass, paste real output): ${gates}`,
].join('\n\n')

phase('Build')
const build = await agent(
  `Read toolkit/orchestrator/prompts/maker.md and toolkit/standards/engineering-standards.md, then follow them.\n\n${spec}\n\nRestate the acceptance criteria first. Implement the smallest complete change, run the gates, and return summary + changed files + the actual gate output tail.`,
  { label: 'maker', isolation: 'worktree', schema: BUILD_RESULT },
)

const LENSES = ['correctness and edge cases', 'canonical-standards compliance']
let round = 0
let openFindings = []
let trace = { build, rounds: [] }

while (round < 2) {
  round += 1
  phase('Review')
  const reviews = await Promise.all(
    LENSES.map((lens) =>
      agent(
        `You are a FRESH-CONTEXT reviewer. Read toolkit/orchestrator/prompts/reviewer.md, toolkit/orchestrator/reviewer-agents.md and toolkit/standards/engineering-standards.md; review through the "${lens}" lens ONLY.\n\nSpec under review:\n${spec}\n\nMaker's reported changed files: ${build.changedFiles.join(', ')}\nMaker's summary (treat as claim, not truth): ${build.summary}\n\nInspect the actual files. Report findings in the required structure; say "no findings" honestly — never fill a quota.`,
        { label: `review:${lens.split(' ')[0]}`, phase: 'Review', schema: FINDINGS },
      ),
    ),
  )

  phase('Verify')
  const candidates = reviews.filter(Boolean).flatMap((r) => r.findings)
  const verified = []
  for (const f of candidates) {
    const verdict = await agent(
      `Read toolkit/orchestrator/dedup-and-verify.md. Verify this single review finding by inspecting the code/evidence yourself — review feedback is a claim to test, not gospel.\n\nFINDING: ${f.title}\nSEVERITY: ${f.severity}\nEVIDENCE: ${f.evidence}\nHOW TO VERIFY: ${f.verifyHow ?? 'inspect the changed files'}`,
      { label: `verify:${f.title.slice(0, 30)}`, phase: 'Verify', schema: VERDICT },
    )
    if (verdict?.accepted) verified.push({ ...f, reason: verdict.reason })
  }

  trace.rounds.push({ round, raised: candidates.length, verified: verified.length, findings: verified })
  openFindings = verified.filter((f) => f.severity !== 'minor')
  if (openFindings.length === 0) break

  phase('Fix')
  await agent(
    `Read toolkit/orchestrator/prompts/fixer.md and toolkit/standards/engineering-standards.md. Fix ONLY these verified findings, re-run the gates (${gates}), and report what changed:\n\n${openFindings
      .map((f) => `- [${f.severity}] ${f.title}: ${f.evidence}`)
      .join('\n')}`,
    { label: 'fixer', phase: 'Fix' },
  )
}

log(openFindings.length === 0 ? 'RUG cycle closed: no open verified findings.' : 'Round limit reached with open findings - human decision required.')
return { ...trace, closed: openFindings.length === 0 }
