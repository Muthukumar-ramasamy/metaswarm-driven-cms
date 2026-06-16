# CRM — Metaswarm + Beads

A Pipedrive-like CRM built as a proving ground for spec-driven, multi-agent development using **metaswarm** orchestration and **Beads** issue tracking.

**Success criterion**: Every module implemented from an approved spec, gated by design review, plan review, TDD, and coverage — zero "code first" exceptions.

---

## Metaswarm Pipeline (non-negotiable order)

```
Requirement
    ↓
/start-task + bd prime
    ↓
/brainstorm                      → design doc in docs/plans/
    ↓
/review-design (5 agents)        → PM · Architect · Designer · Security · CTO — ALL must APPROVE
    ↓
Plan (work units + DoD items)
    ↓
Plan Review Gate (3 reviewers)   → Feasibility · Completeness · Scope — ALL must PASS
    ↓
Codex cross-review               → resolve all blockers before first WU
    ↓
Orchestrated Execution (TDD)
  per work unit: write tests (RED) → implement (GREEN) → adversarial review → commit
    ↓
Coverage Gate                    → lines ≥ 65%, branches ≥ 70%, functions ≥ 50%
    ↓
/self-reflect                    → bd remember key learnings
    ↓
PR
```

**Never skip a step.** No code before design review. No PR before coverage gate and self-reflect.

---

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/start-task` | Prime context, scope task, pick workflow |
| `/prime` | Load relevant knowledge before starting |
| `/brainstorm` | Refine idea into design document |
| `/review-design` | 5-agent parallel design gate |
| `/self-reflect` | Extract learnings → bd remember |
| `/pr-shepherd <pr>` | Monitor PR through to merge |
| `/handle-pr-comments` | Address review comments |
| `/create-issue` | Create a well-structured GitHub Issue |

---

## Non-Negotiable Invariants (all agents enforce these)

1. **No code before an approved spec** — refuse to generate code without it
2. **No hard deletes** — every delete sets `deleted_at = NOW()` — never `DELETE FROM`
3. **Every query scoped by `organization_id`** — no cross-tenant data access, ever
4. **UUIDs for all PKs and FKs** — no auto-increment integers
5. **`organization_id` from JWT only** — never from `req.body` or `req.params`
6. **Standard response envelope** — `{ data }` or `{ data, pagination }` for success; `{ error, message, details }` for errors
7. **Role-restricted UI elements are hidden** — never just disabled
8. **TDD mandatory** — tests written before implementation, always

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TanStack Query v5, React Hook Form, Zod, MUI v5, Emotion |
| Backend | Fastify v4, TypeScript, Drizzle ORM, Zod |
| Database | Neon (PostgreSQL serverless) |
| Auth | JWT (24h TTL, localStorage — ADR-003) |
| Testing | Vitest (unit + integration), Playwright (E2E) |

---

## Project Structure

```
specs/
  features/        — per-module spec bundles (feature, db, api, ui, test specs)
  architecture/    — system context, frontend, backend, security specs
  database/        — schema.md, erd.md, entity specs
  api/             — openapi.yaml (38 endpoints)
  ui/              — 12 page-level UI specs
  templates/       — reusable spec templates

.metaswarm/
  external-tools.yaml  — Codex/Gemini cross-review config

.beads/
  plans/           — active-plan.md (persists approved plans across context windows)

.claude/commands/  — metaswarm skill route files

backend/src/
  modules/         — one subfolder per feature (routes/controller/service/repository/schemas)
  db/schema/       — Drizzle entity definitions
  lib/             — errors.ts, response.ts, jwt.ts, password.ts
  middleware/       — authenticate.ts

frontend/src/
  features/        — one subfolder per feature (pages/components/hooks/api/schemas/types)

e2e/               — Playwright tests
docs/adr/          — Architecture Decision Records (ADR-001 through ADR-004)
vitest.workspace.ts        — monorepo test config (unit + integration projects)
.coverage-thresholds.json  — coverage gate thresholds (read by orchestrator)
```

---

## 8 MVP Modules

| # | Module | Folder | Priority | Status |
|---|--------|--------|----------|--------|
| 1 | Auth & User Management | auth-user-management | P0 | ✅ Phase 1 done |
| 2 | Contact Management | contact-management | P0 | ✅ Done |
| 3 | Company Management | company-management | P0 | 🔲 Next |
| 4 | Lead Management | lead-management | P0 | 🔲 Pending |
| 5 | Deal & Pipeline Management | deal-pipeline-management | P0 | 🔲 Pending |
| 6 | Activity & Task Tracking | activity-task-tracking | P0 | 🔲 Pending |
| 7 | Notes | notes | P1 | 🔲 Pending |
| 8 | Basic Reports | basic-reports | P1 | 🔲 Pending |

Feature specs exist in `specs/features/` for all 8 modules.

---

## Implementation Order

For each module, run the full pipeline:
1. `/start-task {ModuleName}` → `/brainstorm` → `/review-design`
2. Plan → Plan Review Gate → Codex cross-review
3. Orchestrated execution (TDD per work unit)
4. Coverage gate → `/self-reflect` → PR

---

## MCP Integrations

| MCP Server | Package | Purpose |
|------------|---------|---------|
| Neon | `@neondatabase/mcp-server-neon` | Run SQL, inspect schema, manage branches |

**Setup**: Set `NEON_API_KEY` before launching Claude Code:
```powershell
$env:NEON_API_KEY = "your-neon-api-key"
```
The `DATABASE_URL` in `backend/.env` is separate — used by Drizzle ORM for app queries and migrations.

---

## Key Architecture Decisions

| ADR | Decision |
|-----|----------|
| ADR-001 | Fastify over Express |
| ADR-002 | Drizzle ORM over Prisma |
| ADR-003 | localStorage JWT (24h TTL) for MVP |
| ADR-004 | Row-level multi-tenancy (`organization_id` on every table) |

Full ADRs in `docs/adr/`.

---

## Quality Gates

- **Design Review Gate** — 5-agent parallel review after brainstorm (`/review-design`). All must APPROVE.
- **Plan Review Gate** — 3 adversarial reviewers (Feasibility, Completeness, Scope) after plan drafted. All must PASS.
- **Coverage Gate** — `.coverage-thresholds.json` is the single source of truth. BLOCKING before PR.
- **Self-Reflect** — `/self-reflect` + `bd remember` before every PR. BLOCKING.

### Workflow Enforcement (MANDATORY)

- **After brainstorming** → MUST run Design Review Gate before planning or implementation
- **After any plan** → MUST run Plan Review Gate before presenting to user
- **Before finishing a branch** → MUST run `/self-reflect` and commit learnings before PR
- **Complex tasks** → Use `/start-task` instead of `EnterPlanMode` for tasks touching 3+ files
- **Coverage** → `.coverage-thresholds.json` is authoritative — all agents must check it
- **Subagents** → NEVER use `--no-verify`, ALWAYS follow TDD, NEVER self-certify
- **Context recovery** → Plans persist to `.beads/plans/active-plan.md`. After compaction: `bd prime --work-type recovery`

---

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd prime              # load context + memories at session start
bd ready              # find available work
bd show <id>          # view issue details
bd update <id> --claim  # claim work
bd close <id>         # complete work
bd remember --key <k> "fact"  # store persistent memory
bd memories <keyword>  # search knowledge base
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export.

## Agent Context Profiles

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close.

## Session Completion

1. **File issues for remaining work** — create beads for anything needing follow-up
2. **Run quality gates** (if code changed) — tests, linters, builds
3. **Update issue status** — close finished work, update in-progress items
4. **Handle git/sync by active profile** — conservative default: report status, wait for approval
5. **Hand off** — summarize changes, validation, issue status, and any blocked steps

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
<!-- END BEADS INTEGRATION -->
