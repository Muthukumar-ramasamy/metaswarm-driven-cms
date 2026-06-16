# Feature Review: Auth & User Management

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes

---

## Spec compliance

### Backend — Routes / Controller

Cross-reference: `api-spec.md` vs `routes.ts` / `controller.ts`

| Check | Result |
|-------|--------|
| All 11 endpoints from api-spec.md are in routes.ts | ✅ |
| No extra endpoints in routes.ts | ✅ |
| HTTP methods match | ✅ |
| Route paths match exactly | ✅ |
| Request validation schemas match api-spec.md | ✅ |
| Response envelope `{ data }` used | ✅ |
| Error HTTP codes match api-spec.md | ⚠️ — see issue #1 |

**Issue #1 — Untyped error in login (wrong HTTP code risk)**
`backend/src/modules/auth-user-management/service.ts` lines 96 and 112 use `throw new Error('UNAUTHORIZED')` instead of a typed error class. The api-spec.md requires HTTP 401 for wrong credentials. This relies on the error handler recognising the string `'UNAUTHORIZED'` as a 401, which is fragile and undocumented. Use a typed `UnauthorizedError` class consistent with the project's `lib/errors.ts` pattern.

### Backend — Service (Business Rules)

| BR | Check | Result |
|----|-------|--------|
| BR-01 | Last admin guard on deactivate | ✅ (service.ts lines 334–341) |
| BR-01 | Last admin guard on role downgrade | ✅ (service.ts lines 293–299) |
| BR-02 | Self-deactivate last admin blocked | ✅ (service.ts lines 324–330) |
| BR-03 | 72h invite expiry checked | ✅ (service.ts line 171) |
| BR-04 | Password ≥ 8 chars enforced in schema | ✅ (schemas.ts lines 7, 25, 31) |
| BR-05 | Email unique per org on invite | ✅ (service.ts lines 214–217) |
| BR-06 | Deactivated user blocked on login | ✅ (service.ts lines 100–102) |
| BR-07 | 1h reset-token expiry checked | ✅ (service.ts line 152) |
| BR-08 | organizationId from JWT only | ✅ |

**Issue #2 — Login checks deactivated status before verifying password**
`service.ts` lines 100–102 check `status === 'deactivated'` before verifying the password (line 104). A caller with a deactivated account and wrong password gets a 403, revealing that the account exists. The spec requires 401 for wrong credentials (AC-07) and 403 only when credentials are valid but the account is deactivated (AC-08). Fix: verify password first, throw 401 on mismatch, then check status.

### Backend — Repository / Schema

Cross-reference: `db-spec.md` sections 2–4 vs `users.ts`, `organizations.ts`, `0000_common_venus.sql`

| Check | Result |
|-------|--------|
| All db-spec.md fields present in Drizzle schema | ✅ |
| Field types match (UUID, VARCHAR, TIMESTAMPTZ, ENUM) | ✅ |
| `deleted_at` nullable on both tables | ✅ |
| FK `users.organization_id → organizations.id` | ✅ |
| Plain indexes `users_org_idx`, `users_email_org_idx` | ✅ |
| Partial UNIQUE `(organization_id, email) WHERE deleted_at IS NULL` | ❌ — see issue #3 |
| Partial UNIQUE `organizations.slug WHERE deleted_at IS NULL` | ❌ — see issue #3 |

**Issue #3 — Missing partial unique indexes in migration (db-spec.md §4 violated)**
`db-spec.md` section 4 "Critical Constraints" requires:
- `UNIQUE (organization_id, email) WHERE deleted_at IS NULL`
- `UNIQUE ON organizations(slug) WHERE deleted_at IS NULL`

The migration `backend/drizzle/0000_common_venus.sql` creates only plain non-unique indexes. The Drizzle schema (`users.ts` lines 25–27, `organizations.ts`) also lacks `uniqueIndex` with a `where` clause. Without these, duplicate emails within an org or duplicate slugs are not DB-enforced; the service-layer check is the only guard. A concurrent insert race condition would break BR-05 and db-spec.md §4.

**Required fix**: In `backend/src/db/schema/users.ts`, replace `index('users_email_org_idx')` with:
```ts
import { uniqueIndex } from 'drizzle-orm/pg-core'
emailOrgUniqueIdx: uniqueIndex('users_email_org_unique_idx')
  .on(table.organizationId, table.email)
  .where(isNull(table.deletedAt)),
```
In `backend/src/db/schema/organizations.ts`, add:
```ts
slugUniqueIdx: uniqueIndex('orgs_slug_unique_idx')
  .on(table.slug)
  .where(isNull(table.deletedAt)),
```
Generate a new migration to reflect these changes.

### Frontend — Page / Components

Cross-reference: `ui-spec.md` vs `UsersPage.tsx`, `LoginPage.tsx`

| Check | Result |
|-------|--------|
| Team table columns: Name, Email, Role (badge), Status (badge), Actions | ✅ |
| Filters: search, role, status | ✅ |
| Actions: invite, change role, deactivate, resend invite, reactivate | ✅ |
| Loading state: spinner while fetching | ✅ (UsersPage.tsx lines 145–149) |
| Error state: alert on API failure | ✅ (UsersPage.tsx lines 151–153) |
| Empty state handled | ✅ (table always shows at least admin row) |
| Last-admin guard: deactivate disabled | ✅ (UsersPage.tsx line 251) |
| Non-admins redirect from `/settings/users` to `/deals` | ✅ (UsersPage.tsx lines 53–55) |
| Successful login/signup redirects to `/deals` | ❌ — see issue #4 |

**Issue #4 — Login redirect goes to `/contacts` not `/deals` (ui-spec.md violated)**
`frontend/src/features/auth/pages/LoginPage.tsx` line 29:
```ts
if (user) navigate('/contacts', { replace: true })
```
`ui-spec.md` states: "On successful login/signup: JWT stored in localStorage, redirect to `/deals`." All E2E tests (`auth-e2e-01`, `auth-e2e-05`, `auth-e2e-08`) call `waitForURL('/deals')` and would fail against this code path. Change the redirect target to `/deals`.

⚠️ 4 issues found in spec compliance (issues #1, #2, #3, #4)

---

## Security invariants

### Multi-tenancy

| Check | Result |
|-------|--------|
| All user management queries include `organization_id` | ✅ |
| `findUserById`, `findManyUsers`, `updateUser`, `softDeleteUser`, `countActiveAdmins` all scope by `eq(users.organizationId, organizationId)` | ✅ |
| `organizationId` sourced only from `req.user` via `getJwtPayload(req)` | ✅ |
| No cross-tenant data accessible through standard user management routes | ✅ |

Note: `findUserByEmailGlobal` is intentionally cross-tenant and is used correctly in two contexts only — `signup` (global email uniqueness check) and `login` (user lookup before org context is known). All org-scoped reads use `findUserByEmailInOrg` or `findUserById` with `organizationId`.

### Soft delete

| Check | Result |
|-------|--------|
| Zero `DELETE FROM` in repository | ✅ — only `UPDATE SET deleted_at = new Date()` |
| All SELECTs include `isNull(users.deletedAt)` | ✅ |
| `softDeleteUser` uses `UPDATE SET deleted_at` | ✅ (repository.ts lines 167–178) |

### Auth

| Check | Result |
|-------|--------|
| `authenticate` preHandler on all protected routes | ✅ |
| All user management routes protected | ✅ |
| All public auth endpoints correctly unprotected | ✅ |

### Role checks

| Check | Result |
|-------|--------|
| `authorize('admin')` on all user management routes | ✅ |
| Service-level last-admin guard present | ✅ |

### Data exposure

| Check | Result |
|-------|--------|
| `password_hash` excluded via `sanitizeUser` | ✅ (service.ts lines 44–47) |
| `invite_token` excluded via `sanitizeUser` | ✅ |
| `password_reset_token` excluded via `sanitizeUser` | ✅ |
| Sensitive token values logged via `console.info` | ⚠️ Advisory only — marked `[DEV]` / TODO for production SMTP |

### Input safety

| Check | Result |
|-------|--------|
| No raw SQL strings in repository | ✅ — Drizzle ORM only |
| No user input interpolated into query strings | ✅ |

✅ All blocking security invariants passed. No multi-tenancy violations. No soft-delete violations. No data exposure violations.

---

## Test coverage

### AC coverage map

| AC | Criterion | Unit | Integration | E2E | Result |
|----|-----------|------|-------------|-----|--------|
| AC-01 | Workspace creation | ✅ unit-01,03 | ✅ int-01,02 | ✅ e2e-01 | ✅ |
| AC-02 | Duplicate signup email | ✅ unit-02 | — | ✅ e2e-02 | ✅ |
| AC-03 | Invite sent | ✅ unit-09,10 | ✅ int-07 | ✅ e2e-15 | ✅ |
| AC-04 | Invite accepted | ✅ unit-11 | ✅ int-10 | ⚠️ e2e-24 (no token) | ⚠️ |
| AC-05 | Expired invite rejected | ✅ unit-12,13 | ✅ int-05 | ⚠️ e2e-24 (no token) | ⚠️ |
| AC-06 | Login valid credentials | ✅ unit-04 | ✅ int-03,08 | ✅ e2e-05 | ✅ |
| AC-07 | Login invalid credentials | ✅ unit-05,07 | ✅ int-04 | ✅ e2e-06 | ✅ |
| AC-08 | Deactivated user blocked | ✅ unit-07 (file) | — | ❌ none | ⚠️ — see issue #5 |
| AC-09 | Deactivate last admin | ✅ unit-16 | ✅ int-19 | ✅ e2e-18 | ✅ |
| AC-10 | Password reset flow | ✅ unit-23,24,25 | — | ⚠️ e2e-11 (partial) | ⚠️ noted in spec |
| AC-11 | Role change | ✅ unit-17 | ✅ int-20,21 | ✅ e2e-17 | ✅ |
| AC-12 | Resend invite | ✅ unit-20,21 | — | ✅ e2e-20 | ✅ |

**Issue #5 — AC-08 has no E2E test**
The test-spec.md coverage map shows no E2E test for AC-08 (deactivated user blocked at login). The unit and service-level tests cover the business rule, but the end-to-end login page behaviour (displaying the 403 error message) is untested. Add an E2E test that logs in as a deactivated user and verifies the inline error message matches the spec ("Your account has been deactivated. Contact your admin.").

**Issue #6 — Unit test IDs misaligned with test-spec.md**
In `auth-user-management.service.test.ts`, tests auth-unit-06 and auth-unit-07 are swapped relative to test-spec.md:

| Spec claims | File actually contains |
|-------------|------------------------|
| auth-unit-06: ForbiddenError for deactivated user | line 172: "throws UNAUTHORIZED for unknown email" |
| auth-unit-07: NotFoundError for unknown email | line 182: "throws ForbiddenError for deactivated user" |

Both scenarios are tested; this is a traceability issue, not a functional gap. Rename the tests to match the spec IDs.

### Permission coverage

| Role | Action | Expected | Test | Result |
|------|--------|----------|------|--------|
| Admin | View /settings/users | ALLOWED | auth-e2e-14 | ✅ |
| Unauthenticated | View /settings/users | REDIRECT → /login | auth-e2e-22 | ✅ |
| Manager or Sales Rep | View /settings/users | REDIRECT → /deals | Not tested | ⚠️ — see issue #7 |
| Admin | Invite user | ALLOWED | auth-e2e-15 | ✅ |
| Admin | Invite duplicate | 409 inline | auth-e2e-21 | ✅ |
| Admin | Change user role | ALLOWED | auth-e2e-17 | ✅ |
| Admin | Deactivate last admin | DENIED (disabled) | auth-e2e-18 | ✅ |
| Admin | Resend invite | ALLOWED | auth-e2e-20 | ✅ |
| Any | Multi-tenancy isolation | DENIED | int-06,09,12,18,21 | ✅ |

**Issue #7 — Manager/Sales Rep permission denial path not E2E tested**
`auth-e2e-22` is labelled "Manager is redirected" but only tests admin (allowed) and unauthenticated (redirected to /login) paths. No test injects a Manager or Sales Rep JWT and verifies they are redirected to `/deals`. Add an E2E test that sets a Manager token in localStorage and navigates to `/settings/users`, expecting redirect to `/deals`.

### BR coverage

| BR | Tests | Result |
|----|-------|--------|
| BR-01 | unit-16, unit-18, int-19, e2e-18 | ✅ |
| BR-02 | unit-16, e2e-18 | ✅ |
| BR-03 | unit-12, unit-13, e2e-24 | ✅ |
| BR-04 | unit-01, e2e-04 | ✅ |
| BR-05 | unit-02, unit-10, int-06, e2e-21 | ✅ |
| BR-06 | unit-07 (file) | ✅ (unit only) |
| BR-07 | unit-23, unit-24, unit-25 | ✅ |
| BR-08 | int-06, int-09, int-12, int-18, int-21 | ✅ |

### Soft delete and isolation tests

| Test | Coverage |
|------|----------|
| Soft-deleted user absent from list | ✅ int-16 |
| Soft-deleted user still in DB with `deleted_at` set | ✅ int-17 |
| Org A records invisible to org B (email) | ✅ int-06 |
| Org A records invisible to org B (id) | ✅ int-09 |
| findManyUsers returns only caller's org | ✅ int-12 |
| softDeleteUser scoped to org | ✅ int-18 |
| updateUser scoped to org | ✅ int-21 |

⚠️ Gaps: AC-08 no E2E test; Manager permission-denied path not E2E tested; unit test IDs misaligned.

---

## Code quality

### TypeScript

| Check | Result |
|-------|--------|
| Zero `any` in service.ts | ✅ |
| Zero `any` in repository.ts | ✅ |
| Zero `any` in controller.ts | ✅ |
| Weak `string` types in frontend api.ts line 79 | ⚠️ — see issue #8 |
| All function parameters and return types explicitly typed | ✅ |

**Issue #8 — Weak types in frontend api.ts**
`frontend/src/features/auth/api.ts` line 79: `data: { role?: string; status?: string }` uses plain `string` instead of `UserRole` and `UserStatus` from `types.ts`. Change to `data: { role?: UserRole; status?: UserStatus }` to enable compile-time checking.

### Layer separation

| Check | Result |
|-------|--------|
| controller.ts: zero business logic | ✅ |
| service.ts: zero DB queries | ✅ |
| repository.ts: zero business logic | ✅ |
| routes.ts: zero logic | ✅ |

### Frontend patterns

| Check | Result |
|-------|--------|
| No hardcoded API URLs — all via `src/lib/api` | ✅ |
| No direct `fetch()` calls | ✅ |
| Role checks via `useAuth()` | ✅ |
| Zod schemas in schemas.ts match api-spec.md | ✅ |

### Error handling

| Check | Result |
|-------|--------|
| Typed error classes used for all throws | ⚠️ — `new Error('UNAUTHORIZED')` at service.ts lines 96 and 112 (issue #1) |

### Naming conventions

| Check | Result |
|-------|--------|
| Module folder matches kebab slug | ✅ |
| File names follow convention (routes/controller/service/repository/schemas) | ✅ |
| Components PascalCase; hooks `use*` | ✅ |

⚠️ 2 code quality issues (issues #1, #8)

---

## Required changes before merge

1. **[HIGH] Missing partial unique indexes** — `backend/src/db/schema/users.ts`, `backend/src/db/schema/organizations.ts`, new migration file
   Add `uniqueIndex(...).on(...).where(isNull(table.deletedAt))` for `(organization_id, email)` on users and `(slug)` on organizations. Generate a migration. Without this, concurrent insert races can violate BR-05 and db-spec.md §4.
   *Spec violated*: db-spec.md §4 "Critical Constraints"

2. **[HIGH] Untyped `throw new Error('UNAUTHORIZED')` in service.ts** — `backend/src/modules/auth-user-management/service.ts` lines 96 and 112
   Define and use an `UnauthorizedError` class (HTTP 401) in `lib/errors.ts`. Verify the Fastify error handler maps it to 401. No untyped throws are permitted in service.ts.
   *Spec violated*: Code quality rule: "No untyped `throw new Error('...')` in service.ts"

3. **[HIGH] Login redirect target is `/contacts` instead of `/deals`** — `frontend/src/features/auth/pages/LoginPage.tsx` line 29
   Change `navigate('/contacts', { replace: true })` to `navigate('/deals', { replace: true })`.
   *Spec violated*: ui-spec.md "On successful login/signup: redirect to `/deals`"

4. **[MEDIUM] Login deactivated-user check before password check** — `backend/src/modules/auth-user-management/service.ts` lines 100–116
   Move the `bcrypt.compare` call before the `status === 'deactivated'` guard. Correct order: find user → compare password (401 on mismatch) → check status (403 if deactivated).
   *Spec violated*: AC-07 / AC-08 intended differential (credentials wrong → 401; credentials correct + deactivated → 403)

5. **[MEDIUM] AC-08 has no E2E test** — `e2e/auth-user-management.spec.ts`
   Add `auth-e2e-27` (or similar): navigate to `/login`, submit credentials for a deactivated user, verify the inline 403 error message is visible.
   *Spec violated*: test-spec.md coverage map — AC-08 E2E column is empty

6. **[MEDIUM] Manager/Sales Rep permission denied path not tested** — `e2e/auth-user-management.spec.ts`
   Extend or replace `auth-e2e-22` to inject a non-admin JWT into localStorage and navigate to `/settings/users`, asserting redirect to `/deals`.
   *Spec violated*: test-spec.md §6 Permission Coverage table (Manager/Sales Rep denied path)

7. **[LOW] Unit test IDs auth-unit-06 / auth-unit-07 swapped vs test-spec.md** — `backend/src/modules/auth-user-management/__tests__/auth-user-management.service.test.ts` lines 172 and 182
   Renumber or rename the tests so auth-unit-06 covers the deactivated-user case and auth-unit-07 covers the unknown-email case, matching test-spec.md §2.
   *Spec violated*: test-spec.md §2 Unit Tests (traceability only — no functional gap)

8. **[LOW] Weak types in frontend api.ts** — `frontend/src/features/auth/api.ts` line 79
   Change `data: { role?: string; status?: string }` to `data: { role?: UserRole; status?: UserStatus }`.
   *Spec violated*: Code quality rule: "Zero `any` types in frontend hooks, api.ts, types.ts" (extends to typed enums)

---

Fix the 3 HIGH items and items #4–#6, then re-run `/review-feature AuthUserManagement`.
