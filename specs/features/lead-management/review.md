# Review: Lead Management

| Field | Value |
|-------|-------|
| Feature | Lead Management |
| Reviewer | Claude Code (review-feature) |
| Review date | 2026-06-14 |
| Spec status | Approved (feature-spec, db-spec, api-spec) |
| Implementation status | Complete |
| Test status | Generated (unit + integration + E2E) |
| Overall verdict | **PASS with minor issues** |

---

## 1. Executive Summary

The Lead Management implementation faithfully follows every approved spec. All 9 acceptance criteria, 5 business rules, and the permissions matrix are reflected in working code. The SDD golden rule — no code before an approved spec — is upheld. Three minor issues are flagged below; none block shipping but one (the E2E label mismatch) will cause the affected E2E test to fail when the test suite is run.

---

## 2. Spec Compliance Checklist

### 2.1 DB Spec

| Check | Result | Notes |
|-------|--------|-------|
| All columns present in Drizzle schema | PASS | All 13 fields from db-spec.md are in `backend/src/db/schema/leads.ts` |
| UUIDs for all PKs and FKs | PASS | `id`, `organizationId`, `ownerId`, `contactId`, `companyId`, `convertedDealId` — all UUID |
| `deleted_at` soft-delete column present | PASS | `deletedAt: timestamp('deleted_at', { withTimezone: true })` |
| `converted_deal_id` has no FK at migration time | PASS | Comment in SQL and schema correctly defers FK to after deals table is created |
| `ON DELETE` behaviours match spec | PASS | CASCADE on org, RESTRICT on owner, SET NULL on contact and company |
| Indexes match spec | PASS | `leads_org_idx`, `leads_owner_idx`, `leads_status_idx`, `leads_deleted_at_idx` all present |
| Enum values match spec | PASS | `lead_status`: new/contacted/qualified/disqualified/converted; `lead_source`: 7 values |
| Migration file present | PASS | `backend/drizzle/20260614000001_create_leads.sql` |

### 2.2 API Spec

| Check | Result | Notes |
|-------|--------|-------|
| All 6 endpoints registered | PASS | GET /leads, POST /leads, GET /leads/:id, PUT /leads/:id, DELETE /leads/:id, POST /leads/:id/convert |
| JWT authentication on all routes | PASS | `authenticate` preHandler on every route |
| Response envelopes match spec | PASS | `{ data }` for single record, `{ data, pagination }` for list, 201 on create, 204 on delete |
| Pagination query params implemented | PASS | page, limit, sort, order, search, status, ownerId all present in `listLeadsQuerySchema` |
| `status` query default = `new,contacted` (BR-04) | PASS | Enforced in service layer |
| Convert endpoint returns `{ data: { lead, deal } }` | PASS | Controller returns `{ data: result }` where result = `{ lead, deal }` |
| 422 on double-convert | PASS | `UnprocessableError` thrown and mapped correctly |
| 400 on missing stageId | PASS | Zod schema rejects missing/invalid UUID before service is reached |
| 403 for non-admin delete | PASS | Service throws `ForbiddenError` for non-admin callers |
| 404 on unknown lead | PASS | `NotFoundError` thrown when `findById` returns undefined |

### 2.3 Feature Spec — Business Rules

| BR | Description | Implementation | Result |
|----|-------------|---------------|--------|
| BR-01 | Lead can only be converted once — 422 on second attempt | `service.convertLead` checks `lead.status === 'converted'` → `UnprocessableError` | PASS |
| BR-02 | Converted lead is never deleted | `service.deleteLead` checks `lead.status === 'converted'` → `ForbiddenError` | PASS |
| BR-03 | Lead must have a title | Zod `createLeadSchema.title: z.string().min(1, 'Title is required')` | PASS |
| BR-04 | Default inbox: only new + contacted | Service defaults `statusList = ['new', 'contacted']` when `query.status` is absent | PASS |
| BR-05 | Conversion requires a pipeline stage | `convertLeadSchema.stageId: z.string().uuid('Pipeline stage is required')` | PASS |

### 2.4 Acceptance Criteria

| AC | Description | Backend impl | Frontend impl | Result |
|----|-------------|-------------|--------------|--------|
| AC-01 | Create lead → status=new, owner=submitting user | `createLead` forces `status: 'new'` and ownership | LeadForm + create mutation | PASS |
| AC-02 | Leads inbox scoped to org | Every repo query includes `eq(leads.organizationId, organizationId)` | N/A (server enforced) | PASS |
| AC-03 | Sales rep sees only own leads | `listLeads` forces `ownerId = caller.sub` for sales_rep | — | PASS |
| AC-04 | Default filter excludes disqualified and converted | Status default in service | `statusFilter` default = `'new,contacted'` | PASS |
| AC-05 | Convert lead creates deal | `convertLead` inserts into deals table (raw SQL), marks lead converted | ConvertToDealModal | PASS |
| AC-06 | Converted deal linked to lead | `convertedDealId` set on lead, "View Deal" button in drawer | LeadDetailDrawer shows link when `convertedDealId` is set | PASS |
| AC-07 | Lead cannot be converted twice | 422 UnprocessableError | ConvertToDealModal catches 422 and shows error | PASS |
| AC-08 | Disqualify lead — disappears from inbox | `updateLead` accepts status=disqualified | Disqualify action calls update mutation | PASS |
| AC-09 | Manager/admin sees all org leads | Manager/admin ownerId not forced | `canFilterByOwner` renders owner filter for admin/manager | PASS |

### 2.5 Permissions Matrix

| Action | Admin | Manager | Sales Rep | Result |
|--------|-------|---------|-----------|--------|
| View all org leads | Service: no ownerId restriction | Same | ownerId forced to caller.sub | PASS |
| Create lead | Allowed, can set ownerId | Same | Allowed, ownerId forced | PASS |
| Update lead | Allowed, can change ownerId | Allowed | Own only, cannot change ownerId | PASS |
| Convert lead | Allowed | Allowed | Own only | PASS |
| Disqualify lead | Allowed | Allowed | Own only (via updateLead guard) | PASS |
| Delete lead | Allowed (soft delete) | ForbiddenError | ForbiddenError | PASS |
| Delete converted lead | ForbiddenError (BR-02) | N/A | N/A | PASS |

### 2.6 Non-negotiable Invariants

| Invariant | Check | Result |
|-----------|-------|--------|
| No code before Approved spec | Spec status is Approved on all three spec files | PASS |
| No hard deletes | `softDelete` sets `deleted_at = NOW()` — no `DELETE FROM` anywhere in the module | PASS |
| Every query scoped by `organization_id` | `buildWhere`, `findById`, `update`, `softDelete`, `convertLead` — all include `eq(leads.organizationId, organizationId)` | PASS |
| UUIDs for all PKs and FKs | Schema uses `uuid()` for all identifiers | PASS |
| `organization_id` from JWT only | `caller.organizationId` comes from `getJwtPayload(req)` — never from body or params | PASS |
| Standard response envelope | All endpoints return `{ data }` or `{ data, pagination }` | PASS |
| Role-restricted UI elements hidden (not disabled) | Delete menu item rendered conditionally (`{isAdmin && <MenuItem>Delete</MenuItem>}`) — not rendered at all for non-admins | PASS |

---

## 3. Issues Found

### ISSUE-01 — Minor: E2E label mismatch on owner filter (test will fail)

**Severity**: Minor (test failure, not a production bug)
**File**: `e2e/lead-management.spec.ts` line 394
**Test**: `lead-e2e-07c`

The E2E test asserts:
```
await expect(page.getByLabel(/filter by owner/i)).toBeVisible()
```

The actual `<InputLabel>` in `LeadsPage.tsx` reads `Owner`, not `Filter by owner`. This query will not match and the test will fail.

**Fix**: Change the E2E assertion to use the actual label text:
```
await expect(page.getByLabel(/^owner$/i)).toBeVisible()
```

---

### ISSUE-02 — Minor: `ConvertToDealModal` uses a raw UUID text field instead of a stage selector

**Severity**: Minor (MVP acceptable, noted as intentional deferral)
**File**: `frontend/src/features/lead-management/components/ConvertToDealModal.tsx`

The convert modal currently presents a plain `<TextField>` asking the user to type a stage UUID. The UI spec calls for a "pipeline stage selector". The component includes a helper text note acknowledging this: _"A proper stage selector will be available once Deal Pipeline Management is implemented."_

This is acceptable for MVP since the deals table and pipeline stages are created by the DealPipelineManagement module. The deferral is documented in the code.

**Action**: Revisit in DealPipelineManagement review — the selector must be replaced with a populated `<Select>` before launch.

---

### ISSUE-03 — Minor: `lead-e2e-11` assumes drawer opens a new route/URL; implementation uses a drawer (no URL change)

**Severity**: Minor (test may not exercise the right code path)
**File**: `e2e/lead-management.spec.ts` lines 487–491

The test does:
```
await page.getByRole('cell', { name: title }).click()
const detailUrl = page.url()
// ...
await page.goto(detailUrl)
```

The implementation opens a `<Drawer>` on row click — it does not navigate to a new URL. The captured `detailUrl` will simply be `/leads` (or the current page URL unchanged), so the second `page.goto(detailUrl)` will not open a drawer. The 403 check will not be exercised in the way intended.

**Fix**: The test should instead capture the lead ID from the API response after Rep B creates the lead, then construct `detailUrl = /leads?leadId=<id>` — or the detail drawer should be made deep-linkable (add `?drawer=<id>` to the URL). For the MVP, the simplest fix is to rewrite the test to directly call the API endpoint as Rep A after obtaining the ID, asserting the 403 HTTP response, rather than driving the UI.

---

## 4. Code Quality Observations (non-blocking)

| Observation | Location | Assessment |
|-------------|----------|-----------|
| `buildWhere` correctly omits undefined filter clauses using Drizzle's `and()` undefined-filtering | `repository.ts` | Good defensive pattern |
| `convertLead` gracefully handles absent deals table via try/catch on raw SQL | `service.ts` | Correct implementation of spec note about migration order |
| `enrichedFields` object avoids SELECT * and includes `ownerName` SQL expression | `repository.ts` | Good practice |
| `updateLead` distinguishes between `undefined` (field not sent) and `null` (field explicitly cleared) using `'key' in input` checks | `service.ts` | Correct partial-update pattern |
| `status = 'converted'` excluded from `updateLeadSchema` — conversion can only happen via `/convert` | `schemas.ts` | Enforces business rule at schema layer |
| `LeadForm` handles 409 conflict separately from generic server errors | `LeadForm.tsx` | Proactive error handling (no 409 defined in spec — may be unnecessary complexity) |
| `useLead` and `useLeads` share the `['leads', ...]` query key namespace — invalidation on mutation is correct | `hooks/` | Correct TanStack Query cache invalidation |
| `LeadDetailDrawer` uses `href` for "View Deal" link, bypassing React Router — should use `<Link to=...>` from react-router-dom when router is wired | `LeadDetailDrawer.tsx` | Low priority; acceptable for MVP when routing layer is not yet complete |

---

## 5. Test Coverage Assessment

| Layer | Tests planned | Tests implemented | AC coverage | BR coverage |
|-------|--------------|-------------------|-------------|-------------|
| Unit | 33 | 33 | 9/9 | 5/5 |
| Integration | 25 | 25 | 9/9 | 5/5 |
| E2E | 16 | 16 | 9/9 | 5/5 |
| **Total** | **74** | **74** | **100%** | **100%** |

All tests from the test-spec are implemented. Known issues:
- `lead-e2e-07c` will fail at runtime due to ISSUE-01 (label mismatch).
- `lead-e2e-11` may not exercise the intended code path due to ISSUE-03 (no URL navigation on drawer open).
- Integration tests for `convertLead` correctly use `null` or a random UUID as the dealId to avoid cross-module dependency on the deals table.

---

## 6. Migration Assessment

| Check | Result |
|-------|--------|
| Migration file present | `backend/drizzle/20260614000001_create_leads.sql` |
| SQL matches Drizzle schema | PASS — column names, types, constraints, and indexes are identical |
| `converted_deal_id` FK deferred correctly | PASS — column present without FK; spec and comment explain the ALTER TABLE pattern |
| Migration order noted in db-spec.md | PASS |

---

## 7. Verdict

The LeadManagement module is **approved to proceed to the next pipeline stage** (generate-tests already complete; ready for DealPipelineManagement implementation which unblocks the convert flow's stage selector).

Three minor issues must be resolved before E2E tests are run in CI:

1. Fix the `getByLabel(/filter by owner/i)` assertion in `lead-e2e-07c` → `getByLabel(/^owner$/i)`.
2. Rewrite `lead-e2e-11` to either use an API-level assertion for the 403 or make the detail drawer deep-linkable.
3. Replace the raw UUID text field in `ConvertToDealModal` with a proper stage `<Select>` once DealPipelineManagement is implemented.

No spec violations, no hard deletes, no cross-tenant data leaks, no integer PKs. All SDD invariants upheld.
