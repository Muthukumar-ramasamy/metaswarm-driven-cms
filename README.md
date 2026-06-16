# CRM — Metaswarm + Beads

A Pipedrive-like CRM built as the proving ground for a **spec-driven, multi-agent development** workflow, orchestrated by **[metaswarm](https://github.com/dsifry/metaswarm)** and tracked with **[Beads](https://github.com/gastownhall/beads)**.

> The primary goal is not "build a CRM." It is: given any feature requirement, the framework generates specs, architecture, code, and tests — with every step gated by adversarial quality checks — with minimal manual intervention.

---

## How It Works

This project replaces manual coding with a structured agent pipeline. Every module goes through the same sequence, enforced by metaswarm quality gates.

```
Requirement
    ↓
/start-task + bd prime          ← load context, check active PRs
    ↓
/brainstorm                     ← refine scope, create design doc
    ↓
/review-design (5 agents)       ← PM · Architect · Designer · Security · CTO
    ↓ all APPROVED
Plan (work units + DoD items)
    ↓
Plan Review Gate (3 adversarial reviewers)   ← Feasibility · Completeness · Scope
    ↓ all PASS
Codex cross-review (gpt-5.5)   ← catches issues same-model review misses
    ↓ blockers resolved
Orchestrated Execution (TDD)
  for each work unit:
    WRITE tests (RED)
    ↓
    IMPLEMENT code (GREEN)
    ↓
    ADVERSARIAL REVIEW
    ↓
    COMMIT
    ↓
Coverage Gate                   ← lines ≥ 65%, branches ≥ 70%, functions ≥ 50%
    ↓ PASS
/self-reflect                   ← extract learnings → bd remember
    ↓
PR
```

---

## Orchestration Stack

| Tool | Role |
|------|------|
| **[metaswarm](https://github.com/dsifry/metaswarm)** | Multi-agent orchestration, quality gates, skill library |
| **[Beads (bd)](https://github.com/gastownhall/beads)** | Issue tracking, persistent memory, session context |
| **[Codex](https://openai.com/codex)** | Cross-model plan review (catches blind spots in Claude-vs-Claude review) |
| **Claude Code** | Primary execution agent (Claude Sonnet 4.6) |

### Metaswarm Commands

| Command | Purpose |
|---------|---------|
| `/start-task` | Prime context, scope complexity, pick workflow |
| `/prime` | Load relevant knowledge before starting |
| `/brainstorm` | Refine idea into a design document |
| `/review-design` | 5-agent design gate (PM, Architect, Designer, Security, CTO) |
| `/self-reflect` | Extract session learnings → knowledge base |
| `/pr-shepherd` | Monitor PR through to merge |
| `/handle-pr-comments` | Address review comments |

### Beads Commands

```bash
bd prime              # load context + memories at session start
bd ready              # find available work
bd show <id>          # view issue details
bd update <id> --claim  # claim work
bd close <id>         # complete work
bd remember --key <k> "fact"   # store persistent memory
bd memories <keyword>  # search knowledge base
bd compact            # semantic summarization of closed issues
```

---

## Quality Gates (Non-Negotiable)

| Gate | Trigger | Blocking |
|------|---------|---------|
| **Design Review** | After brainstorm — before plan | All 5 agents must APPROVE |
| **Plan Review** | After plan drafted — before execution | All 3 reviewers must PASS |
| **Codex Cross-Review** | After plan review — before first WU | All blockers must be resolved |
| **Coverage** | After all WUs — before PR | lines ≥ 65%, branches ≥ 70%, functions ≥ 50% |
| **Self-Reflect** | Before PR creation | Learnings committed to `bd remember` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TanStack Query v5, React Hook Form, Zod, MUI v5 |
| Backend | Fastify v4, TypeScript, Drizzle ORM, Zod |
| Database | Neon (PostgreSQL serverless) |
| Auth | JWT (24h TTL, localStorage) |
| Testing | Vitest (unit + integration), Playwright (E2E) |
| Migrations | SQL files in `backend/drizzle/` |

---

## Non-Negotiable Code Rules

1. **No code before an Approved spec** — agents refuse to generate code without it
2. **No hard deletes** — every delete sets `deleted_at = NOW()`, never `DELETE FROM`
3. **Every query scoped by `organization_id`** — no cross-tenant data access
4. **UUIDs for all PKs and FKs** — no auto-increment integers
5. **`organization_id` from JWT only** — never from `req.body` or `req.params`
6. **Standard response envelope** — `{ data }` or `{ data, pagination }` for success
7. **Role-restricted UI elements are hidden** — never just disabled
8. **TDD mandatory** — tests written before implementation, always

---

## CRM Modules (MVP)

| # | Module | Status | Tests |
|---|--------|--------|-------|
| 1 | Auth & User Management (Phase 1) | ✅ Implemented | 16 tests |
| 2 | Contact Management | ✅ Implemented | 63 tests |
| 3 | Company Management | 🔲 Spec approved, not started | — |
| 4 | Lead Management | 🔲 Spec approved, not started | — |
| 5 | Deal & Pipeline Management | 🔲 Spec approved, not started | — |
| 6 | Activity & Task Tracking | 🔲 Spec approved, not started | — |
| 7 | Notes | 🔲 Spec approved, not started | — |
| 8 | Basic Reports | 🔲 Spec approved, not started | — |

---

## Repo Structure

```
├── specs/
│   ├── features/        # Per-module spec bundles (feature, db, api, ui, test specs)
│   ├── architecture/    # System, frontend, backend, security specs
│   ├── database/        # ERD, schema docs
│   ├── api/             # openapi.yaml (38 endpoints)
│   └── templates/       # Reusable spec templates
├── .metaswarm/
│   └── external-tools.yaml   # Codex/Gemini cross-review config
├── .beads/
│   ├── plans/           # active-plan.md — persists approved plans across context windows
│   └── interactions.jsonl
├── backend/
│   ├── src/
│   │   ├── modules/     # One subfolder per feature (routes/controller/service/repository/schemas)
│   │   ├── db/schema/   # Drizzle entity definitions
│   │   ├── lib/         # errors.ts, response.ts, jwt.ts, password.ts
│   │   └── middleware/  # authenticate.ts, authorize.ts
│   └── drizzle/         # SQL migration files
├── frontend/
│   └── src/features/    # One subfolder per feature (pages/components/hooks/api/schemas/types)
├── docs/adr/            # Architecture Decision Records (ADR-001 to ADR-004)
├── e2e/                 # Playwright tests
├── vitest.workspace.ts  # Monorepo test config (unit + integration projects)
└── .coverage-thresholds.json  # Coverage gate thresholds (read by orchestrator)
```

---

## Running the Project

```bash
# Backend
cd backend
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install
npm run dev                   # Fastify on :3000

# Frontend
cd frontend
npm install
npm run dev                   # Vite on :5173

# Tests (from project root)
npx vitest run --project unit           # unit tests only
npx vitest run --project integration    # integration + HTTP smoke tests
npx vitest run --coverage               # coverage report
```

---

## Architecture Decisions

| ADR | Decision |
|-----|---------|
| ADR-001 | Fastify over Express — faster, schema-first |
| ADR-002 | Drizzle ORM over Prisma — lightweight, SQL-close |
| ADR-003 | localStorage JWT (24h TTL) for MVP |
| ADR-004 | Row-level multi-tenancy via `organization_id` on every table |

Full ADRs in `docs/adr/`.
