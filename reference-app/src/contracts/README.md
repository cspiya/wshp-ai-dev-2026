# `src/contracts/` — shared cross-boundary schemas

Zod schemas / types shared by **more than one** module land here (e.g. pagination
envelopes, common IDs). This is the app's only coordination point between modules,
so changes here get the strictest review gate.

Rule of thumb: a schema used by one module belongs in that module's
`*.contract.ts`, not here. Promote it only when a second module actually needs it.
