# Project memory & retrieval kit

Agents forget everything between sessions; the repository must not. This kit
is the minimal layout that keeps decisions, rules, and context retrievable —
by humans and by agents.

## Memory layout (what lives where)

| Artifact | Location | What belongs there |
|---|---|---|
| Root operating rules | `AGENTS.md` (+ `CLAUDE.md` = `@AGENTS.md` pointer) | The operating contract every session loads: gates, standards links, language policy |
| Per-module rules | `<module>/AGENTS.md` | Only what differs inside that boundary (golden path, local commands, scope guardrails) |
| Decisions | `docs/adr/NNNN-<slug>.md` | One decision per file: context → decision → consequences. Append-only; superseding ADRs link back |
| Work state | The tracker (e.g. Linear issue + lease comments) | Never in repo files — a repo snapshot of "current status" is stale the moment it lands |
| Standards | `toolkit/standards/*.md` | The single canonical checklist both maker and reviewer link to |

## Docs-sync rule

Documentation changes IN the same commit as the behavior it describes —
"update the docs later" is how memory rots. The reviewer checks it: a
behavior or rule change without its doc change is a finding.

## Retrieval quickstarts

**Code: structure + LSP, not RAG.** Code retrieval is already solved by
structure (module contracts, golden-path folders) and the language server:
go-to-definition, find-references, and rename are exact, embeddings are not.
Quickstart: any LSP-enabled editor or agent harness; keep modules small
enough that one module = one context window.

**Docs: local RAG only when the corpus outgrows grep.** For teaching-scale
repos, `git grep` + a clean layout beats an index. When a docs corpus grows
past that (hundreds of pages), point a local RAG MCP server (e.g.
`mcp-local-rag`) at `docs/` and the ADRs ONLY — never at source code, that is
the LSP's job.

**Context budget:** see `toolkit/checklists/context-budget.md` — memory
that does not fit the window is not memory, it is an archive.

## UI-generálási memória (egy designirány)

A participant starter a `participant-starter/.mcp.json.example` fájlban adja a
shadcn MCP-t és az opcionális v0 adaptert. A starter `DESIGN-GUIDELINE.md` fájlja
az a tartós memória, amely következetessé teszi a generált UI-t. v0-ban **egyetlen**
vizuális irányt készíts és fogadj el, majd az elfogadott kimenetből folytasd; több
spekulatív variáns gyorsan elfogyaszthatja az ingyenes kreditet. Ha nincs v0-kapacitás,
használd Claude designképességét ugyanazzal a guideline-nal és acceptance criteria-val.
A szolgáltató adapter, nem ok a design újrakezdésére.
