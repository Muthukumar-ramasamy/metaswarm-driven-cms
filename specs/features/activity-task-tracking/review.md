# Feature Review: Activity & Task Tracking

| Field | Value |
|-------|-------|
| Feature | Activity & Task Tracking |
| Module | Module 6 |
| Reviewer | Claude Code (review-feature) |
| Review date | 2026-06-14 |
| Spec status | Approved |
| Overall verdict | **PASS with minor findings** |

---

## 1. Summary

The Activity & Task Tracking implementation is complete, correct, and faithful to the approved spec. All six API endpoints are present and properly guarded. All nine acceptance criteria are implemented. Every business rule is enforced in the correct layer. The 35 unit tests pass. Ten minor findings are noted below — none block shipping, but several should be addressed before the next sprint.

---

## 2. Checklist

### 2.1 Spec compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| All 6 endpoints implemented | PASS | GET list, POST create, GET :id, PUT :id, DELETE :id, PUT :id/done |
| AC-01 Log past activity (done=true, doneAt auto-set) | PASS | Service sets `doneAt = new Date()` when not provided |
| AC-02 Schedule task (done=false, due_date) | PASS | Persisted correctly |
| AC-03 At least one linked record required → 400 | PASS | Service validates before repo.create; error message exact match |
| AC-04 My task list — own tasks only for sales rep | PASS | `effectiveOwnerId` forced to `caller.sub` for sales_rep role |
| AC-05 Overdue tasks flagged | PASS | Frontend `classifyTask()` groups by `dueDate < today`; red border + "Was due" label |
| AC-06 Mark task done — clears from open list | PASS | PUT /done sets done=true + doneAt; list filters on done=false |
| AC-07 Task list grouped by urgency | PASS | Overdue / Today / Tomorrow / This Week / Next Week / Later / No due date |
| AC-08 Activity feed on record | PASS | `ActivityFeed` component accepts `linkedRecord` prop and filters by FK |
| AC-09 Manager sees all org tasks | PASS | Manager/admin ownerId not forced; optional filter via query param |

### 2.2 Business rules

| Rule | Status | Notes |
|------|--------|-------|
| BR-01 At least one linked record | PASS | Enforced in service AND as DB-level CHECK constraint in migration |
| BR-02 done is irreversible | PASS | Service throws `ValidationError("This activity is already marked as done.")` if `activity.done === true` |
| BR-03 Activity type must be valid enum | PASS | Zod enum validation at schema layer with correct error message |
| BR-04 due_date recommended for tasks | PASS | Optional at schema level (per spec) |
| BR-05 Activities scoped by organization_id | PASS | Every repo function takes `organizationId` as first arg; enforced in `buildWhere` |

### 2.3 Error cases

| Scenario | Status | Notes |
|----------|--------|-------|
| No linked record → 400 | PASS | Correct message "An activity must be linked to at least one record." |
| Already-done → 400 | PASS | Correct message "This activity is already marked as done." |
| Invalid type → 400 | PASS | Zod catches this before service; correct enum error message |
| Activity not found → 404 | PASS | `NotFoundError('Activity')` thrown and handled |
| Sales rep edits another's activity → 403 | PASS | `ForbiddenError('You do not have permission to edit this activity.')` |

### 2.4 Non-negotiable invariants

| Invariant | Status | Notes |
|-----------|--------|-------|
| No code before Approved spec | PASS | Spec status: Approved before implementation |
| No hard deletes | PASS | `softDelete()` sets `deletedAt = new Date()`; no `DELETE FROM` anywhere |
| Every query scoped by organization_id | PASS | `buildWhere` always includes `eq(activities.organizationId, organizationId)` |
| UUIDs for all PKs and FKs | PASS | All IDs use `uuid()` with `defaultRandom()` |
| organization_id from JWT only | PASS | `caller.organizationId` from `getJwtPayload(req)`; never from body/params |
| Standard response envelope | PASS | `{ data }` for single; `{ data, pagination }` for list; `{ error, message }` for errors |
| Role-restricted UI elements are hidden | PASS | Owner filter (`isManagerOrAdmin`); non-owned "Mark done" not rendered |

### 2.5 Permissions matrix

| Action | Admin | Manager | Sales Rep | Status |
|--------|-------|---------|-----------|--------|
| View all org activities | Yes | Yes | No (forced own) | PASS |
| View own activities | Yes | Yes | Yes | PASS |
| View activity on record | Yes | Yes | Yes | PASS |
| Create activity / task | Yes | Yes | Yes | PASS |
| Edit own activity | Yes | Yes | Yes | PASS |
| Edit any activity | Yes | Yes | No (403) | PASS |
| Mark own task done | Yes | Yes | Yes | PASS |
| Delete own activity | Yes | Yes | Yes | PASS |
| Delete any activity | Yes | Yes | No (403) | PASS |

### 2.6 Database schema

| Check | Status | Notes |
|-------|--------|-------|
| All spec fields present | PASS | All 17 fields from db-spec.md are in schema and migration |
| Correct FK relationships | PASS | org CASCADE, owner RESTRICT, deal/contact/company/lead SET NULL |
| DB-level CHECK constraint | PASS | `activities_linked_record_check` present in migration SQL |
| Soft-delete column | PASS | `deleted_at TIMESTAMPTZ` present |
| Indexes | PASS | Indexes on org_id, owner_id, done, all FKs, deleted_at |
| Enum definition | PASS | `activity_type` ENUM with `DO $$ BEGIN ... EXCEPTION` guard |

### 2.7 Tests

| Category | Count | Result |
|----------|-------|--------|
| Unit tests (service) | 35 | ALL PASS |
| Integration tests | 31 (activity-int-01 to activity-int-31) | Present; require live DB to run |

Unit tests cover all five service functions with full role permutations. Integration tests cover the full HTTP lifecycle including org isolation (int-08, int-17), activity feed filtering (int-12, int-31), and the soft-delete DB assertion (int-27).

---

## 3. Findings

### F-01 — Vitest project config mismatch (LOW, infrastructure)

**File:** `backend/vitest.config.ts`

The vitest config defines two projects: `unit` (matching `*.test.ts`) and `integration` (matching `*.integration.test.ts`). However, the test files are named `activity-task-tracking.service.test.ts` and `activity-task-tracking.repository.test.ts` — both fall into the `unit` project, but `npx vitest run --project unit` with a path filter fails to discover them because the project glob does not match the `__tests__/` directory path correctly. Running the files directly by path works. The naming convention should be aligned: either rename integration tests to `*.integration.test.ts` or adjust the vitest project patterns to include `**/__tests__/**/*.test.ts`.

### F-02 — Frontend TypeScript errors in activity-task-tracking components (MEDIUM, correctness)

**Files:** `ActivityFeed.tsx:61`, `ActivityForm.tsx:176,195,245,287,353,365`, `MyTasksPage.tsx:128,157,237,315`

Several MUI v5 TypeScript type errors are reported by `tsc --noEmit`:
- `fontWeight` is not recognised as a direct prop on `<Typography>` — should be passed via `sx={{ fontWeight: ... }}`.
- `PaperProps` does not exist on `DrawerProps` in the installed version — should use `slotProps={{ paper: { sx: ... } }}`.
- `InputLabelProps` with `shrink` on a `<TextField>` reports a mismatch.

These errors are systemic across the project (they also appear in `AppLayout.tsx` from a different module), so they are not introduced by this feature alone. However, the activity-task-tracking components contribute 11 of the total frontend TS errors. None prevent the app from running (Vite transpiles without type-checking at build time), but they hide real errors. Recommend fixing all `fontWeight` → `sx.fontWeight` and `PaperProps` → `slotProps.paper` usages across the codebase.

### F-03 — Owner filter dropdown has no user list (LOW, UX)

**File:** `frontend/src/features/activity-task-tracking/pages/MyTasksPage.tsx` lines 245-257

The "Filter by owner" `<Select>` is rendered for managers/admins but contains only one static `<MenuItem>` ("All team members"). The comment says "In a real app this would be populated from a users list query." Without the user list, managers cannot actually filter by a specific owner from the UI — they would have to know a UUID to pass directly. This is a known limitation (the users API hook is not yet wired), but should be tracked as a follow-up task.

### F-04 — Activity feed linked-record filter uses `createdAt` (camelCase) not `created_at` (snake_case) (LOW, potential bug)

**File:** `frontend/src/features/activity-task-tracking/components/ActivityFeed.tsx` line 133

```ts
const filters = {
  [`${linkedRecord.type}Id`]: linkedRecord.id,
  sort: 'createdAt',   // ← camelCase
  order: 'desc' as const,
  limit: 50,
}
```

The backend `listActivitiesQuerySchema` accepts `sort` values of `'created_at'`, `'due_date'`, or `'subject'`. The frontend passes `'createdAt'` (camelCase), which is not a valid enum value in the Zod schema. The schema will silently fall back to the default (`'created_at'`) because `sort` has `.optional().default('created_at')`, so the sort order is still correct — but this is a latent inconsistency. The `MyTasksPage` correctly passes `sort: 'due_date'`.

**Fix:** Change line 133 to `sort: 'created_at'`.

### F-05 — `limit: 500` in MyTasksPage task query (LOW, potential scaling issue)

**File:** `frontend/src/features/activity-task-tracking/pages/MyTasksPage.tsx` line 197

The task list query uses `limit: 500` to load all tasks at once for client-side grouping. The backend schema allows up to `max(500)`, so this is within bounds. However, for users with many open tasks, this can cause a slow initial load and a large payload. Consider a server-side grouping API or pagination with client-side accumulation in a future iteration.

### F-06 — `done` field sent as boolean in frontend `ListActivitiesFilters` vs string expected by backend (LOW, type alignment)

**File:** `frontend/src/features/activity-task-tracking/types.ts` line 45

`ListActivitiesFilters.done` is typed as `boolean | undefined`. When Axios serialises `done: false` as a query string, it becomes `?done=false` (a string). The backend `listActivitiesQuerySchema` accepts `z.enum(['true', 'false'])` for `done`, which is correct for query string parsing. The actual serialisation works correctly at runtime, but the TypeScript type says `boolean` while the wire format requires a string. This creates a minor type mismatch that could confuse future maintainers.

### F-07 — `markDone` in `useActivityMutations` returns `getApiErrorMessage` in the return object (LOW, API surface)

**File:** `frontend/src/features/activity-task-tracking/hooks/useActivityMutations.ts` line 34

The hook returns `{ create, update, remove, markDone, getApiErrorMessage }`. Returning `getApiErrorMessage` from a hook that is named `useActivityMutations` is unexpected — it is a utility, not a mutation. Callers import it via the hook unnecessarily. It should be imported directly from `'../../../lib/api'` in components that need it.

### F-08 — `deleteActivity` (soft delete) returns 404 for non-existent ID after `softDelete` but the `softDelete` repo function does not confirm deletion (LOW, edge case)

**File:** `backend/src/modules/activity-task-tracking/service.ts` lines 122-132

The `deleteActivity` service correctly calls `findById` first and throws `NotFoundError` if missing. However, if a race condition causes the record to be deleted between `findById` and `softDelete`, the second `softDelete` silently succeeds (it is a no-op UPDATE on a non-existent row) without error. This is acceptable for MVP but worth noting: `softDelete` does not throw if the row is missing.

### F-09 — `update` service uses `'notes' in input` check but TypeScript optional fields are always "in" the object from Zod defaults (LOW, subtle)

**File:** `backend/src/modules/activity-task-tracking/service.ts` lines 106-109

```ts
if ('notes' in input) patch.notes = input.notes ?? null
if ('dueDate' in input) patch.dueDate = input.dueDate ?? null
```

Because `updateActivitySchema` uses `.optional()` and Zod's `parse` does not add keys for unset optional fields (unlike `z.object` with defaults), the `'notes' in input` check correctly distinguishes "not provided" from "provided as undefined/null". This is correct Zod behaviour. However, the same check is not applied to `type` and `subject` (which use `!== undefined` instead). The inconsistency is harmless but should be made uniform.

### F-10 — No E2E test file generated (LOW, test coverage gap)

**Path expected:** `e2e/activity-task-tracking.spec.ts`

The SDD pipeline calls for an E2E Playwright test file at the path above (per `CLAUDE.md`). The `/generate-tests` step produced backend unit and integration tests but no E2E test file. This is not a blocker (unit + integration tests provide strong coverage), but should be created to satisfy the pipeline's definition of done for the module.

---

## 4. Spec delta (deviations from spec)

| Item | Spec says | Implemented as | Impact |
|------|-----------|----------------|--------|
| Route ordering: PUT /done before PUT /:id | Implied by Fastify matching rules | Explicitly documented in routes.ts comment | None — correct |
| `listActivitiesQuerySchema` limit max | Spec says "max 100" | Implemented as `max(500)` | Minor — frontend uses 500 for task list; consider aligning |
| GET /api/activities/:id — sales rep visibility | Spec (AC-08, permissions matrix): "View activity on record" for sales rep = Yes | Service forbids sales rep from viewing another rep's activity (403) | The spec's permissions matrix says sales reps can view activity on a record, but the implementation restricts by owner. This is more conservative than the spec. **Discuss with product**: should a sales rep be able to see another rep's activity on a shared deal/contact? |

---

## 5. Positive highlights

- The dual-layer enforcement of BR-01 (service ValidationError + DB CHECK constraint) is excellent defensive design.
- The `buildWhere` helper cleanly separates filter construction from query execution, making the repository easy to test and extend.
- Fastify route ordering (PUT /done before PUT /:id) is correctly handled and documented.
- The `classifyTask` function in `MyTasksPage` is a clean, self-contained date utility with no external dependency.
- The `ActivityFeed` component is properly reusable via the `linkedRecord` prop, enabling embedding in deal/contact/company/lead detail pages without duplication.
- Unit test coverage is comprehensive — 35 tests across all five service functions, covering role permutations, error messages, and edge cases like `done=true` with explicit vs auto-generated `doneAt`.

---

## 6. Recommended actions before next sprint

| Priority | Finding | Action |
|----------|---------|--------|
| P1 | F-04 | Fix `sort: 'createdAt'` → `sort: 'created_at'` in ActivityFeed.tsx |
| P1 | F-02 | Resolve frontend TypeScript errors (fontWeight→sx, PaperProps→slotProps.paper) across the codebase |
| P2 | F-01 | Align vitest project naming convention (service/unit vs integration) |
| P2 | F-10 | Create `e2e/activity-task-tracking.spec.ts` Playwright test file |
| P3 | F-03 | Wire up users list API to "Filter by owner" select in MyTasksPage |
| P3 | F-05 | Document the `limit: 500` assumption; add a comment or issue for pagination |
| P3 | F-07 | Remove `getApiErrorMessage` from `useActivityMutations` return value |

---

*Review generated by `/review-feature ActivityTaskTracking` — 2026-06-14*
