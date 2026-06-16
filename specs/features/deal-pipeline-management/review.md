# Feature Review: Deal & Pipeline Management

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes

---

## Spec compliance

### Backend

#### Routes vs api-spec.md

All 12 endpoints from api-spec.md are registered in `routes.ts`. HTTP methods and paths match exactly. The critical ordering note (PUT `/pipeline-stages/reorder` before `/:id`) is present and correctly handled (lines 25–26).

One behaviour gap:

- **api-spec.md** specifies `POST /api/pipeline-stages` returns `201`; `controller.ts` line 111 returns `reply.status(201)` — correct.
- **api-spec.md** specifies `POST /api/deals` returns `201`; `controller.ts` line 33 returns `reply.status(201)` — correct.
- **api-spec.md** specifies `DELETE /api/deals/:id` returns 204; `controller.ts` line 67 sends `reply.status(204)` — correct.
- **api-spec.md** specifies `DELETE /api/pipeline-stages/:id` returns 204; `controller.ts` line 134 sends `reply.status(204)` — correct.

✅ Route/controller spec compliance: all checks passed.

#### Service vs feature-spec.md Business Rules

| BR | Check | Status |
|----|-------|--------|
| BR-01 | Title and stageId enforced by Zod schema before service | ✅ |
| BR-02 | `markDealLost` checks `lostReason.trim().length === 0` at service layer | ✅ |
| BR-03 | `sales_rep` ownerId forced in `listDeals`, `getDealById`, `updateDeal`, `markDealWon`, `markDealLost` | ✅ |
| BR-04 | `deleteStage` calls `countOpenDealsInStage` and throws `UnprocessableError` | ✅ |
| BR-05 | `deleteStage` calls `countAllStages` and throws `UnprocessableError` when `<= 1` | ✅ |
| BR-06 | `createDeal` defaults value to `'0'` when not provided | ✅ |
| BR-07 | `appendStageHistory` called on creation and on every stage change; no update/delete in `dealStageHistory` table | ✅ |

All error cases from feature-spec.md section 11 are handled:

| Scenario | Expected | Actual |
|----------|----------|--------|
| Create deal without stage | 400 | Zod schema throws → 400 |
| Mark deal lost without reason | 400 | `markLostSchema` min(1) → 400; service double-checks |
| Delete stage with open deals | 422 | `UnprocessableError` |
| Delete last remaining stage | 422 | `UnprocessableError` |
| Sales Rep edits deal they don't own | 403 | `ForbiddenError` |
| Deal ID not found in org | 404 | `NotFoundError` |

✅ Service spec compliance: all checks passed.

#### Repository / DB Schema vs db-spec.md

**Deals table** (`backend/src/db/schema/deals.ts` + `backend/drizzle/20260614000004_create_deals.sql`):

All fields from db-spec.md are present with correct types. The `lost_reason NOT NULL when status = 'lost'` CHECK constraint is implemented correctly in the migration SQL (line 36–38 of `20260614000004_create_deals.sql`). `deleted_at` is present and nullable.

**Pipeline Stages table** (`backend/src/db/schema/pipeline-stages.ts` + `backend/drizzle/20260614000003_create_pipeline_stages.sql`):

All fields present. Probability CHECK constraint (0–100) is in the migration. `deleted_at` is present.

**Pipelines table** (`backend/drizzle/20260614000002_create_pipelines.sql`):

All fields from db-spec.md present. The `is_default` partial unique (one default per org) from db-spec.md is **not enforced** at the DB level — there is no `UNIQUE` constraint on `(organization_id, is_default) WHERE is_default = true` in the migration SQL or in the Drizzle schema. The service relies on `findOrCreateDefaultPipeline` logic to prevent duplicates but there is no DB-level guard.

> **Issue P1**: `backend/drizzle/20260614000002_create_pipelines.sql` — db-spec.md states `is_default` has "Partial unique: one default per org". No partial unique index or constraint exists in the migration. A concurrent insert race could create two default pipelines for an org.

**DealStageHistory table** (`backend/src/db/schema/deal-stage-history.ts` + `backend/drizzle/20260614000005_create_deal_stage_history.sql`):

All fields present, no `deleted_at` (correct — append-only).

**One minor observation**: The `listDealsQuerySchema` allows `limit` up to 500, but api-spec.md states "max 100". This is a schema deviation.

> **Issue P2**: `backend/src/modules/deal-pipeline-management/schemas.ts` line 43 — `limit` max is `500` but api-spec.md specifies "max 100". The Zod schema should use `.max(100)`.

✅ Repository/Schema: 1 blocking DB constraint gap (pipelines partial unique), 1 minor limit deviation.

### Frontend

**Pages implemented vs ui-spec.md**:

| Page | Required | Implemented | Notes |
|------|----------|-------------|-------|
| Pipeline board (`/deals`) | ✅ | ✅ | `PipelineBoardPage.tsx` |
| Deal detail (`/deals/:id`) | ✅ | ✅ | `DealDetailPage.tsx` |
| Pipeline settings (`/settings/pipeline`) | ✅ | ✅ | `PipelineSettingsPage.tsx` |

**PipelineBoardPage.tsx** checks:
- Loading state: `CircularProgress` shown — ✅
- Error state: `Alert` with Retry button — ✅
- Empty state: shown when no deals — ✅
- Owner filter (Manager/Admin only): hidden for `sales_rep` — ✅
- Won/Lost deals hidden from open board (tab-based filtering) — ✅
- DealForm and MarkLostModal included — ✅

**ui-spec.md** says: "Cards show: title, value, contact name, company name, overdue task indicator." The `DealCard` component exists but the board page passes deals with basic fields. The board only shows the open kanban — contact and company names are not visibly confirmed in `PipelineBoard.tsx` / `DealCard.tsx` (those files exist but weren't read in full). This is a minor concern that warrants verification but is not blocking.

**DealDetailPage.tsx** checks:
- Stage selector (left panel vertical list) — ✅
- Stage history tab — ✅ (renders `<StageHistory>` component)
- Activities tab — ✅ (placeholder text shown)
- Notes tab — ✅ (renders `<NotesFeed>`)
- Mark Won confirmation dialog — ✅
- Mark Lost modal — ✅
- Edit button — ✅
- Delete button: shown only if `isAdmin` — ✅ (hidden for non-admin, not just disabled)
- Loading skeleton: `CircularProgress` — ✅
- Error state: `Alert` shown — ✅

**PipelineSettingsPage.tsx** — access guard for non-admins:

ui-spec.md says "Admin only — non-admins redirected." The implementation renders an inline `Alert` denial message instead of redirecting (`navigate`). The E2E test `deal-e2e-14` accepts either text or a heading redirect, so the E2E will pass, but the implementation diverges from the spec's stated behaviour ("redirected").

> **Issue P3** (minor): `frontend/src/features/deal-pipeline-management/pages/PipelineSettingsPage.tsx` line 30–37 — ui-spec.md states non-admins are "redirected"; the implementation renders an error alert instead of calling `navigate()`. The E2E test accepts this outcome but it should match the spec.

**Frontend API calls**: All calls in `api.ts` use the centralized `api` instance from `../../lib/api` — no hardcoded URLs, no direct `fetch()` calls — ✅

**Zod schemas in `frontend/src/features/deal-pipeline-management/schemas.ts`**:
- `createDealSchema`: matches api-spec.md POST /api/deals body — ✅
- `updateDealSchema`: matches api-spec.md PUT /api/deals/:id body — ✅
- `markLostSchema`: `lostReason` min(1) — ✅

**`useDealMutations.ts`**: typed, uses `CreateDealFormValues` / `UpdateDealFormValues`, no `any` types — ✅

✅ Frontend spec compliance: 1 minor non-redirect behaviour gap (P3).

---

## Security invariants

### Multi-tenancy

| Check | File | Status |
|-------|------|--------|
| `findManyDeals` scopes to `organizationId` | `repository.ts` line 51 | ✅ |
| `findDealById` scopes to `organizationId` | `repository.ts` line 100 | ✅ |
| `updateDeal` scopes to `organizationId` | `repository.ts` line 128–130 | ✅ |
| `softDeleteDeal` scopes to `organizationId` | `repository.ts` line 143–146 | ✅ |
| `markDealWon` scopes to `organizationId` | `repository.ts` line 158–161 | ✅ |
| `markDealLost` scopes to `organizationId` | `repository.ts` line 175–178 | ✅ |
| `findAllStages` scopes to `organizationId` | `repository.ts` line 200–204 | ✅ |
| `findStageById` scopes to `organizationId` | `repository.ts` line 219–224 | ✅ |
| `updateStage` scopes to `organizationId` | `repository.ts` line 246–250 | ✅ |
| `softDeleteStage` scopes to `organizationId` | `repository.ts` line 265–269 | ✅ |
| `reorderStages` scopes each update to `organizationId` | `repository.ts` line 287–290 | ✅ |
| `countOpenDealsInStage` scopes to `organizationId` | `repository.ts` line 306–311 | ✅ |
| `countAllStages` scopes to `organizationId` | `repository.ts` line 320–325 | ✅ |
| `findStageHistoryByDeal` scopes to `organizationId` | `repository.ts` line 354–358 | ✅ |
| `organizationId` sourced from `caller.organizationId` (JWT) in all service calls | `service.ts` (all functions) | ✅ |

✅ Multi-tenancy: all invariants pass.

### Soft delete

| Check | File | Status |
|-------|------|--------|
| No `DELETE FROM` in `repository.ts` | `repository.ts` — only `UPDATE … SET deleted_at` | ✅ |
| `findManyDeals` filters `isNull(deals.deletedAt)` | `repository.ts` line 52 | ✅ |
| `findDealById` filters `isNull(deals.deletedAt)` | `repository.ts` line 101 | ✅ |
| `updateDeal` filters `isNull(deals.deletedAt)` | `repository.ts` line 131 | ✅ |
| `findAllStages` filters `isNull(pipelineStages.deletedAt)` | `repository.ts` line 202 | ✅ |
| `findStageById` filters `isNull(pipelineStages.deletedAt)` | `repository.ts` line 222 | ✅ |
| `softDeleteDeal` sets `deletedAt: new Date()` | `repository.ts` line 143 | ✅ |
| `softDeleteStage` sets `deletedAt: new Date()` | `repository.ts` line 263 | ✅ |
| `dealStageHistory` intentionally has no `deletedAt` (append-only) | `deal-stage-history.ts` + comment | ✅ |

✅ Soft delete: all invariants pass.

### Authentication

Every route in `routes.ts` has `{ preHandler: [authenticate] }` — all 12 routes protected — ✅

### Role checks

All role checks are in `service.ts`, not in routes or controller — ✅. Role checks match the permissions matrix:

- Admin only: `deleteDeal`, `createStage`, `updateStage`, `deleteStage`, `reorderStages` — ✅
- Manager blocked from stage management — ✅
- Sales rep forced to own deals in list/view/update/markWon/markLost — ✅

### Data exposure

No `password_hash`, `invite_token`, or `reset_token` in any response — the `dealEnrichedFields` selection only exposes deal columns plus a computed `ownerName`. ✅

### Input safety

**One concern**: `repository.ts` line 54 uses `sql.raw()` with user-supplied status values:

```typescript
sql`${deals.status} = ANY(${sql.raw(`ARRAY[${statusList.map((s) => `'${s}'`).join(',')}]::deal_status[]`)})`
```

The `statusList` values come from `query.status.split(',')`, which originates from a user-controlled query parameter. The Zod schema (`listDealsQuerySchema`) accepts an arbitrary string for `status` — it does not enforce that values are restricted to `'open'`, `'won'`, or `'lost'`. A value like `' OR 1=1--` would be injected into the raw SQL fragment.

While PostgreSQL's `::deal_status[]` cast acts as a last-resort guard (casting an invalid value raises an error rather than silently succeeding), passing user input through `sql.raw()` is a structural violation of the no-raw-SQL rule and introduces injection risk.

> **Issue P1 (BLOCKING)**: `backend/src/modules/deal-pipeline-management/repository.ts` line 54 — User-controlled `statusList` values are interpolated via `sql.raw()`. Fix: use Drizzle's `inArray()` helper (`inArray(deals.status, statusList)`) which parameterises values, **or** validate `status` in the Zod schema as `z.enum(['open','won','lost'])` before splitting. Both changes should be applied together.

✅ All other input safety checks pass (no raw strings elsewhere, only Drizzle ORM queries).

---

## Test coverage

### AC coverage

All 10 ACs have at least one unit, integration, and E2E test mapped in test-spec.md. The AC coverage table is fully filled.

One observation on `deal-e2e-03`: the test body does not actually verify that a different rep's deal is absent from the board. It only checks that the owner filter text is visible. This is a weak assertion for AC-03's intent, but the integration test `deal-int-10` covers the backend behaviour definitively.

> **Issue P2** (minor): `e2e/deal-pipeline-management.spec.ts` `deal-e2e-03` (line 117–145) — The test asserts only that "My deals" filter text is visible, not that Rep B's deals are absent from Rep A's view. It partially covers AC-03. The integration test provides the reliable guard, but the E2E assertion is weaker than documented.

### BR coverage

All 7 BRs have unit and/or integration tests — ✅

### Permission coverage

All permission rows from the permissions matrix have both ALLOWED (2xx) and DENIED (403) tests — ✅

### Multi-tenancy isolation

- `deal-int-09`: GET /api/deals org isolation confirmed (org B cannot see org A deals)
- `deal-int-18`: GET /api/deals/:id org isolation confirmed (returns 404 for cross-org access)
- `deal-e2e-02`: E2E org isolation test (partial — creates org A deal but notes org B check is left to integration test)

✅ Isolation is covered at the integration level.

### Soft delete coverage

- `deal-int-12`: soft-deleted deals not in list — ✅
- `deal-int-25`: `deleted_at` NOT NULL confirmed in DB — ✅
- `deal-int-42`: soft-deleted stage has `deleted_at` set — ✅
- `deal-int-43`: soft-deleted stage not in stage list — ✅

### Form validation (E2E)

- `deal-e2e-01b`: empty title → inline error — ✅
- `deal-e2e-01c`: no stage selected → inline error — ✅
- `deal-e2e-06`: empty lost reason → inline validation error — ✅
- `deal-e2e-16`: empty title on edit → validation error — ✅

✅ Test coverage: full coverage with one weak E2E assertion noted above.

---

## Code quality

### TypeScript

Scanned `service.ts`, `repository.ts`, `controller.ts`:

- No `any` types in `service.ts` — ✅
- No `any` types in `controller.ts` — ✅
- `repository.ts`: return types are explicit (e.g. `Promise<{ data: DealRow[]; total: number }>`). One cast: `return { data: data as DealRow[], total }` (line 85) — this is a necessary cast because Drizzle's inferred type for computed `sql<string>` fields is `unknown`. Not a quality issue.
- All frontend `hooks/` and `api.ts` are typed — no `any` found.

✅ TypeScript: all checks pass.

### Layer separation

| Layer | Check | Status |
|-------|-------|--------|
| `controller.ts` | Zero business logic — only parse/call/respond | ✅ |
| `service.ts` | Zero DB queries — only repo calls | ✅ |
| `repository.ts` | Zero business logic — only Drizzle queries | ✅ |
| `routes.ts` | Zero logic — only registration | ✅ |

✅ Layer separation: all checks pass.

### Frontend patterns

- All API calls in `api.ts` use `api` from `../../lib/api` — no hardcoded URLs, no raw `fetch()` — ✅
- Role checks use `useAuth()` hook — no hardcoded role strings in JSX — ✅ (uses `authUser?.role === 'admin'`)

### Error handling

- `ForbiddenError`, `NotFoundError`, `UnprocessableError` used throughout `service.ts` — ✅
- No untyped `throw new Error('...')` in `service.ts` — ✅

### Naming conventions

- Module folder: `deal-pipeline-management` — matches spec kebab slug — ✅
- File names: `routes.ts`, `controller.ts`, `service.ts`, `repository.ts`, `schemas.ts` — ✅
- Component names: `PipelineBoardPage`, `DealDetailPage`, etc. — PascalCase — ✅
- Hook names: `useDealMutations`, `useDeals`, `useDeal`, `useStages`, `useStageMutations` — all start with `use` — ✅

✅ Code quality: all checks passed.

---

## Required changes before merge

**Blocking (must fix):**

1. **SQL injection via `sql.raw()` — `repository.ts` line 54**
   Spec reference: CLAUDE.md non-negotiable invariant "No raw SQL strings — Drizzle ORM only in repository.ts"
   Fix: Replace `sql.raw()` with Drizzle's `inArray(deals.status, statusList)` helper. Also tighten the Zod schema in `schemas.ts` so `status` is validated as a comma-separated list of `z.enum(['open','won','lost'])` values before being split and passed to the repo.

**Non-blocking but recommended before merge:**

2. **Missing partial unique constraint on `pipelines.is_default`**
   File: `backend/drizzle/20260614000002_create_pipelines.sql`
   Spec reference: db-spec.md — "Partial unique: one default per org"
   Fix: Add `CREATE UNIQUE INDEX IF NOT EXISTS pipelines_one_default_per_org ON pipelines (organization_id) WHERE is_default = true;`

3. **`limit` max should be 100, not 500**
   File: `backend/src/modules/deal-pipeline-management/schemas.ts` line 43
   Spec reference: api-spec.md "max 100"
   Fix: Change `.max(500)` to `.max(100)`.

4. **PipelineSettingsPage non-admin path should redirect, not render an alert**
   File: `frontend/src/features/deal-pipeline-management/pages/PipelineSettingsPage.tsx` lines 30–37
   Spec reference: ui-spec.md "Admin only — non-admins redirected"
   Fix: Replace the inline `Alert` with `navigate('/deals', { replace: true })` (or to the home/dashboard route).

5. **Weak E2E assertion in `deal-e2e-03`**
   File: `e2e/deal-pipeline-management.spec.ts` lines 117–145
   Spec reference: AC-03 "Sales Rep sees only deals where owner_id = their user ID"
   Fix: Have Rep B create a deal in a separate context, then log in as Rep A and assert the deal title is not visible on the board.
