<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent rules

Starter for a small website built with AI-assisted development
(Next.js App Router + TypeScript + Tailwind + shadcn/ui).

## Rules

1. Follow `DESIGN-GUIDELINE.md` for anything visual.
2. UI building blocks come from `src/components/ui/` (shadcn/ui — local source,
   you may edit it). Add new ones with `npx shadcn@latest add <component>`.
3. Keep it simple: no new libraries, patterns, or abstractions unless the task
   truly needs them. One implementation ⇒ no interface.
4. Code, comments, and commit messages are English.
5. Before declaring any task done, run and fix until green:
   `npm run typecheck && npm run lint && npm run test`

> This file grows during the workshop — every recurring correction you give
> the agent belongs here as a rule.
