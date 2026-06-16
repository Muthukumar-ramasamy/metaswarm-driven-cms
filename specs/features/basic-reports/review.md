# Feature Review: BasicReports

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes

---

## Spec compliance

### Backend

#### Routes vs api-spec.md

| Endpoint (api-spec.md) | Implemented? | Method | Path |
|------------------------|--------------|--------|------|
| GET /api/reports/deals | ✅ | GET | /deals |
| GET /api/reports/pipeline-value | ✅ | GET | /pipeline-value |
| GET /api/reports/activities | ✅ | GET | /activities |
| GET /api/reports/leads-by-source | ✅ | GET | /leads-by-source |

- All four endpoints implemented; no extra endpoints present.
- HTTP methods match (all GET, read-only).
- Route paths match exactly.
- `fastify.authenticate` preHandler on every route. ✅
- Request validation delegated to controller via `reportQuerySchema` / `pipelineValueQuerySchema`. ✅
- Response envelope is `{ data }` for all four handlers. ✅

#### Controller

- Zero business logic — each handler does exactly: parse query → call service → `reply.send({ data })`. ✅
- No BR logic, no role checks, no direct DB access. ✅

#### Service vs feature-spec.md Business Rules

| BR | Spec requirement | Enforced? |
|----|-----------------|-----------|
| BR-01 | organizationId always from JWT (never body/query) | ✅ `caller.organizationId` passed directly; never reads `req.body` or `req.query` |
| BR-02 | Sales Rep ownerId silently overridden to `caller.sub` | ✅ `resolveOwnerId()` returns `caller.sub` for `sales_rep` unconditionally |
| BR-03 | Reports read-only — no mutations | ✅ Service exports only four `get*` functions |
| BR-04 | Default date range = last 30 days | ✅ `defaultDateRange()` covers 30-day window |

Error cases from feature-spec.md:

| Error case | Expected | Implemented? |
|------------|----------|-------------|
| Sales Rep passes another user's ownerId | Silent override (no 403) | ✅ `resolveOwnerId()` |
| Invalid date format | 400 ValidationError | ✅ `parseDateRange()` and Zod `isoDateRegex` |
| startDate after endDate | 400 ValidationError | ✅ `parseDateRange()` |
| ownerId references user outside org | 404 NotFoundError | ✅ `findUserInOrg()` → NotFoundError |

#### Repository vs db-spec.md

The db-spec.md specifies no new schema entities. The repository reads from `deals`, `activities`, `leads`, `pipeline_stages`, and `users`.

- Every query includes `eq(table.organizationId, organizationId)` as first WHERE condition. ✅
- Every query includes `isNull(table.deletedAt)`. ✅
- JOIN tables (`pipelineStages`, `users`) also scoped with `organizationId` and `deletedAt` filters in the join condition. ✅
- No raw SQL strings — all queries use Drizzle ORM operators. ✅
- No `DELETE FROM` statements anywhere in repository.ts. ✅
- Pipeline value ordered by `asc(pipelineStages.displayOrder)` per AC-03. ✅

**Backend: ✅ All checks passed**

---

### Frontend

#### ReportsPage vs ui-spec.md

| UI spec requirement | Implemented? |
|--------------------|-------------|
| Single scrollable page with 4 sections | ✅ `ReportsPage.tsx` renders all four section components in a `<Stack>` |
| Shared date range picker at the top | ✅ `DateRangePicker` rendered above sections |
| Date range presets: Last 7 / 30 / 90 days / This quarter | ✅ All four presets in `DateRangePicker.tsx` |
| Default: last 30 days | ✅ `defaultFilters()` in ReportsPage; `computePreset('last30')` in DateRangePicker |
| Deals summary section | ✅ `DealsReportSection.tsx` — won/lost count + value cards |
| Pipeline value section — stage table, sorted by stage order | ✅ `PipelineValueSection.tsx` — table with stage rows (order enforced by backend) |
| Activity summary — rep name, count per type, total | ✅ `ActivitiesReportSection.tsx` — all six type columns |
| Leads by source — source name, count | ✅ `LeadsBySourceSection.tsx` |
| Loading state: skeleton shown | ✅ Skeleton components in all four section components |
| Error state: error message + retry button | ✅ MUI `<Alert>` with Retry action in all four section components |
| Empty state | ✅ `PipelineValueSection`, `ActivitiesReportSection`, `LeadsBySourceSection` render empty-state text; `DealsReportSection` renders a spinner fallback (minor — count 0 is a valid data state, not a true empty-state gap) |
| Sales Rep: ownerId selector hidden | ✅ `canFilterByRep` logic in ReportsPage; sales_rep never sees ownerId passed |
| Manager/Admin: "filter by rep" selector visible | ❌ **MISSING** — `canFilterByRep` is computed (line 26–27) but no rep-selector control is rendered anywhere in the page JSX |

**Issue FE-01**: `frontend/src/features/basic-reports/pages/ReportsPage.tsx` (lines 26–33) — `canFilterByRep` is computed but the UI has no `<Select>` or combobox for owner/rep filtering. Managers and Admins cannot set `ownerId` through the UI, making the Manager-level ownerId filter completely unreachable from the frontend. ui-spec.md states "Manager/Admin see all org data by default; can filter by rep via owner dropdown." The E2E tests `reports-e2e-13` and `reports-e2e-14` assert that a rep-filter control is visible for manager/admin — both will fail as written.

**Issue FE-02**: `frontend/src/features/basic-reports/components/PipelineValueSection.tsx` (line 133) — the grand-total row is labelled **"Total"** in the JSX, but the E2E test `reports-e2e-08` looks for `/grand total/i` or `/total value/i`. Neither pattern matches the string "Total". The test will fail. The ui-spec references a "grand total" concept; aligning the label to "Grand Total" is the minimal fix.

**Frontend: ⚠️ 2 issues found**

---

## Security invariants

### Multi-tenancy

| Check | File | Verdict |
|-------|------|---------|
| Every repo query scoped by `organization_id` | `repository.ts` — all four `get*` functions | ✅ |
| `organization_id` sourced only from `req.user.organizationId` (JWT) | `service.ts` lines 103, 129, 151, 175 | ✅ |
| JOIN tables also scoped | `repository.ts` — pipelineStages and users joined with `eq(table.organizationId, organizationId)` | ✅ |
| Cross-tenant query impossible | Confirmed — no unscoped queries | ✅ |

### Soft delete

| Check | File | Verdict |
|-------|------|---------|
| Zero `DELETE FROM` statements | `repository.ts` | ✅ |
| Every SELECT includes `WHERE deleted_at IS NULL` | `repository.ts` — `isNull(deals.deletedAt)`, `isNull(activities.deletedAt)`, `isNull(leads.deletedAt)`, `isNull(pipelineStages.deletedAt)`, `isNull(users.deletedAt)` | ✅ |

### Auth

| Check | File | Verdict |
|-------|------|---------|
| `authenticate` preHandler on every protected route | `routes.ts` lines 19, 25, 31, 39 | ✅ |
| No protected route reachable without JWT | Confirmed — all four routes have preHandler | ✅ |

### Role checks

| Check | File | Verdict |
|-------|------|---------|
| Role checks in service.ts (not route/controller) | `service.ts` `resolveOwnerId()` checks `caller.role === 'sales_rep'` | ✅ |
| Sales Rep ownerId silently overridden (no 403) | `service.ts` line 69–71 | ✅ |
| Manager/Admin see all org data when no ownerId | `service.ts` line 82 — returns `undefined` | ✅ |

### Data exposure

| Check | Verdict |
|-------|---------|
| No `password_hash` in any response | ✅ Reports module never touches the users password_hash field |
| No `invite_token` or `reset_token` in any response | ✅ |
| No sensitive fields logged | ✅ No logger calls in service.ts |

### Input safety

| Check | Verdict |
|-------|---------|
| No raw SQL strings — Drizzle ORM only | ✅ Only Drizzle operators used; `sql<number>` template used for aggregates (parameterised) |
| No user input interpolated into query strings | ✅ |

**Security invariants: ✅ All invariants passed — no blocking violations**

---

## Test coverage

### AC coverage

| AC | Description | Coverage | Verdict |
|----|-------------|----------|---------|
| AC-01 | Deals filtered by date range | reports-unit-01/06/07/08/09, reports-int-02/03, reports-e2e-03/04/05/06 | ✅ |
| AC-02 | Pipeline value scoped to org, open only | reports-unit-12/13, reports-int-06/08, reports-e2e-07 | ✅ |
| AC-03 | Pipeline value grouped by stage in display_order | reports-unit-12, reports-int-07, reports-e2e-07/08 | ✅ |
| AC-04 | Activity report by rep, filtered by date range | reports-unit-15/17, reports-int-09/10, reports-e2e-09 | ✅ |
| AC-05 | Leads by source, filtered by date range | reports-unit-19, reports-int-13/14, reports-e2e-10 | ✅ |
| AC-06 | Sales Rep sees own data only | reports-unit-03/04/16/20, reports-int-04/11, reports-e2e-11/12 | ✅ |
| AC-07 | Manager sees all-org data | reports-unit-05/11, reports-int-12, reports-e2e-13/14 | ✅ (tests defined; e2e-13/14 will fail due to FE-01) |
| AC-08 | Default date range is last 30 days | reports-unit-06/17, reports-e2e-01/02/03 | ✅ |

All 8 ACs have tests defined. E2E tests for AC-07 (`reports-e2e-13`, `reports-e2e-14`) will fail at runtime due to the missing rep-filter UI (FE-01).

### BR coverage

| BR | Tests | Verdict |
|----|-------|---------|
| BR-01 | reports-unit-02/13, reports-int-01/08/12/15/16 | ✅ |
| BR-02 | reports-unit-03/04/14/16/20, reports-int-04/11 | ✅ |
| BR-03 | reports-unit-21, reports-e2e-15 | ✅ |
| BR-04 | reports-unit-06/17, reports-e2e-01 | ✅ |

### Permission coverage

| Row | Allowed test | Denied test | Verdict |
|-----|-------------|-------------|---------|
| Admin — view reports | reports-e2e-08/10/14 | — | ✅ |
| Manager — all-org data | reports-unit-05, reports-e2e-13 | — | ✅ (e2e-13 will fail per FE-01) |
| Manager — filter by any rep | reports-unit-11, reports-e2e-13 | — | ✅ (e2e-13 will fail per FE-01) |
| Sales Rep — view own data | reports-e2e-11 | — | ✅ |
| Sales Rep — other ownerId silently blocked | — | reports-unit-03/04/14/16/20 | ✅ |
| Sales Rep — no rep-filter selector | — | reports-e2e-12 | ✅ |
| Unauthenticated — redirect to /login | — | reports-e2e-16 | ✅ |

### Org isolation

- `reports-int-01`: Org A won deals invisible to Org B. ✅
- `reports-int-08`: Org isolation on pipeline value. ✅
- `reports-int-12`: Org isolation on activities. ✅
- `reports-int-15/16`: findUserInOrg cross-tenant lookup returns undefined. ✅

### Soft-delete tests

- `reports-int-05`: Soft-deleted deals not counted. ✅
- `reports-int-17`: Soft-deleted users excluded from findUserInOrg. ✅

**Test coverage: ✅ Full coverage defined — 2 E2E tests will fail at runtime due to FE-01/FE-02 (implementation gaps, not test gaps)**

---

## Code quality

### TypeScript

| File | `any` types | Return types | Verdict |
|------|------------|--------------|---------|
| `service.ts` | None | All four functions explicitly typed with `Promise<DealsReportData>` etc. | ✅ |
| `repository.ts` | None — `sql<number>` template literals are Drizzle's typed mechanism | All functions typed | ✅ |
| `controller.ts` | None | Fastify handler signatures inferred | ✅ |
| `frontend/api.ts` | None | Return types via `Promise<DealsReport>` etc. | ✅ |
| `frontend/types.ts` | None | All interfaces explicit | ✅ |

One minor observation: `repository.ts` line 249 has `row.source as string` — the `source` field on leads is nullable in the Drizzle schema, and the code filters `null` rows immediately above (line 248) before the cast, so this is safe and not a `any` issue, but it is a non-null assertion via cast. Not blocking.

### Layer separation

| Rule | Verdict |
|------|---------|
| `controller.ts` — zero business logic | ✅ Parse / call service / respond only |
| `service.ts` — zero direct DB queries | ✅ Only calls `repo.*` functions |
| `repository.ts` — zero business logic | ✅ Only Drizzle queries |
| `routes.ts` — zero logic | ✅ Registration and preHandler attachment only |

### Frontend patterns

| Rule | Verdict |
|------|---------|
| Zero hardcoded API URLs — via `src/lib/api` | ✅ `frontend/src/features/basic-reports/api.ts` line 1 imports from `../../lib/api` |
| Zero direct `fetch()` calls | ✅ All calls via `api.get()` |
| Role checks via `useAuth()` | ✅ `ReportsPage.tsx` line 21: `const user = useAuth()` |
| No hardcoded role strings in UI logic | Minor note: `user.role === 'admin'` and `user.role === 'manager'` appear as literals (line 27), which is acceptable since there's no `ROLES` enum in the current codebase — not a blocking issue |

### Error handling

| Rule | Verdict |
|------|---------|
| Typed error classes used | ✅ `ValidationError` and `NotFoundError` from `../../lib/errors` |
| No `throw new Error('...')` in service.ts | ✅ |
| Fastify error handler maps typed errors to HTTP codes | Not directly visible in this module — assumed inherited from global error handler in `app.ts` |

### Naming

| Rule | Verdict |
|------|---------|
| Module folder matches kebab slug | ✅ `backend/src/modules/basic-reports/` |
| File names follow convention | ✅ routes.ts, controller.ts, service.ts, repository.ts, schemas.ts |
| Component names PascalCase | ✅ |
| Hook names start with `use` | ✅ |

**Code quality: ✅ All checks passed**

---

## Required changes before merge

1. **[FE-01] Add "filter by rep" selector for Manager/Admin — `frontend/src/features/basic-reports/pages/ReportsPage.tsx`**

   `canFilterByRep` is computed at line 26 but no UI control renders the rep-filter dropdown. Add a `<Select>` or autocomplete control (for manager/admin only) that sets `filters.ownerId`. This is required by ui-spec.md ("Manager/Admin see all org data by default; can filter by rep via owner dropdown"), by AC-07, and by E2E tests `reports-e2e-13` and `reports-e2e-14`. The backend already handles the `ownerId` query param correctly — this is purely a missing frontend control.

2. **[FE-02] Rename "Total" row label in PipelineValueSection to "Grand Total" — `frontend/src/features/basic-reports/components/PipelineValueSection.tsx` line 133**

   The footer row uses `<strong>Total</strong>`. The E2E test `reports-e2e-08` looks for `/grand total/i` or `/total value/i`. Change the label to **"Grand Total"** so the test locator matches and the UI aligns with the language used in the api-spec.md response shape (`grandTotal` field) and the pipeline value section described in the ui-spec.

No other blocking issues. The backend (service, repository, routes, controller), security invariants, and test coverage are all fully compliant with the approved specs.
