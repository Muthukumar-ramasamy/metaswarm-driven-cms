# Test Spec: Auth & User Management — Phase 1

---

## 1. Coverage Map

| AC # | Criterion | Unit | Integration | E2E |
|------|-----------|------|-------------|-----|
| AC-01 | Workspace creation (signup) | auth-unit-01, auth-unit-02, auth-unit-03 | auth-int-01, auth-int-02 | auth-e2e-01 |
| AC-02 | Duplicate signup email | auth-unit-04 | — | auth-e2e-02 |
| AC-03 | Login with valid credentials | auth-unit-05 | auth-int-03 | auth-e2e-05 |
| AC-04 | Login with invalid credentials | auth-unit-06, auth-unit-07 | auth-int-04 | auth-e2e-06 |
| AC-05 | Deactivated user blocked | auth-unit-08 | — | — |
| AC-06 | Logout clears session | — | — | auth-e2e-09, auth-e2e-10 |

---

## 2. Unit Tests

**File**: `backend/src/modules/auth/__tests__/auth.service.test.ts`

> Module folder is `modules/auth/` per `specs/architecture/backend.md`. File name must end in `.service.test.ts` to match vitest workspace glob.

**Mocks:**
```typescript
vi.mock('../auth.repository')
vi.mock('../../../lib/password')
vi.mock('../../../lib/jwt')
```

```
AuthService
  signup()
    ✅ auth-unit-01: creates org + admin user + returns JWT for valid inputs
    ✅ auth-unit-02: returns user object with no passwordHash field (AC-01)
    ✅ auth-unit-03: calls createOrganization + createUser + signToken in order
    ✅ auth-unit-04: throws AppError(409, CONFLICT) when findUserByEmailGlobal returns a user (AC-02)

  login()
    ✅ auth-unit-05: returns { token, user } with organizationId for valid active user (AC-03)
    ✅ auth-unit-06: throws AppError(401, UNAUTHORIZED) when password does not match (AC-04)
    ✅ auth-unit-07: throws AppError(401, UNAUTHORIZED) when email not found — same error as wrong password (no enumeration) (AC-04)
    ✅ auth-unit-08: throws AppError(403, FORBIDDEN) when user status is deactivated (AC-05)

  login() — boundary
    ✅ auth-unit-09: throws AppError(401, UNAUTHORIZED) when user status is pending (not 403 — pending ≠ deactivated)
```

---

## 3. Integration Tests

**File**: `backend/src/modules/auth/__tests__/auth.repository.test.ts`

> Module folder is `modules/auth/` per `specs/architecture/backend.md`. File name must end in `.repository.test.ts` to match vitest workspace glob:
> `backend/src/modules/**/__tests__/*.repository.test.ts`

**Test environment:**
- Neon test DB (real queries, no mocks)
- Requires `DATABASE_URL` pointing to a test Neon database
- Setup file: `backend/src/test/setup.ts` (loaded by vitest workspace config)

**Cleanup pattern (uses soft delete — never DELETE FROM):**
```typescript
let testOrgId: string

afterEach(async () => {
  if (testOrgId) {
    await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.organizationId, testOrgId))
    await db.update(organizations)
      .set({ deletedAt: new Date() })
      .where(eq(organizations.id, testOrgId))
    testOrgId = undefined
  }
})
```

```
repo.createOrganization
  ✅ auth-int-01: returns record with UUID id, name, slug for valid input

repo.createUser
  ✅ auth-int-02: returns { id } with a valid UUID; record exists in DB

repo.findUserByEmailGlobal
  ✅ auth-int-03: returns user record including passwordHash when email exists
  ✅ auth-int-04: returns undefined for unknown email
  ✅ auth-int-05: returns undefined for soft-deleted user (WHERE deleted_at IS NULL)

Multi-tenancy boundary
  ✅ auth-int-06: findUserByEmailGlobal searches across orgs (global for signup duplicate check)
```

---

## 4. E2E Tests (Playwright) — Phase 1

**File**: `e2e/auth-user-management.spec.ts`

> Note: E2E tests require both frontend and backend to be running. Frontend is Phase 2 scope for this module. These test IDs are reserved for when frontend is implemented.

```
Signup
  ⏳ auth-e2e-01: AC-01 — new org signup creates workspace, redirects to /deals
  ⏳ auth-e2e-02: AC-02 — duplicate email shows 409 error message inline
  ⏳ auth-e2e-03: signup form validation — required fields show inline errors
  ⏳ auth-e2e-04: signup — password too short shows inline error (BR-04)

Login
  ⏳ auth-e2e-05: AC-03 — valid credentials log in and redirect to /deals
  ⏳ auth-e2e-06: AC-04 — wrong password shows 401 error message inline
  ⏳ auth-e2e-07: login form validation — empty submit shows inline errors
  ⏳ auth-e2e-08: already-logged-in user visiting /login is redirected to /deals

Logout
  ⏳ auth-e2e-09: AC-06 — logout clears session and redirects to /login
  ⏳ auth-e2e-10: AC-06 — after logout, visiting a protected page redirects to /login
```

---

## 5. Business Rule Coverage (Phase 1)

| BR # | Rule | Test IDs |
|------|------|----------|
| BR-04 | Passwords must be at least 8 characters | auth-unit-01 (Zod enforces at schema layer), auth-e2e-04 |
| BR-05 | Email globally unique in Phase 1 | auth-unit-04, auth-int-03 |
| BR-06 | Deactivated user cannot log in | auth-unit-08 |
| BR-08 | organization_id always from JWT — never from request body | auth-int-01 through auth-int-06 (org_id never in body) |

---

## 6. Permission Coverage (Phase 1)

| Role | Action | Expected | Test ID |
|------|--------|----------|---------|
| Any | Sign up | ALLOWED | auth-e2e-01 |
| Active user | Log in | ALLOWED | auth-e2e-05 |
| Deactivated user | Log in | 403 FORBIDDEN | auth-unit-08 |
| Pending user | Log in | 401 UNAUTHORIZED | auth-unit-09 |
| Any authenticated | Log out | 204 | auth-e2e-09 |
| Unauthenticated | POST /api/auth/logout | 401 UNAUTHORIZED | auth-unit-missing-token |

---

## 7. Test Environment

| Requirement | Value |
|-------------|-------|
| Unit test DB | None — repository is fully mocked |
| Integration test DB | Neon test DB (real queries) |
| Integration setup file | `backend/src/test/setup.ts` (required by vitest workspace config) |
| Auth tokens | `createTestToken(user)` from `backend/src/test/helpers.ts` (Phase 2) |
| Cleanup strategy | Soft-delete only — `UPDATE SET deleted_at = NOW()`, never `DELETE FROM` |
| Unit test mocks | `vi.mock('../auth-user-management.repository')`, `vi.mock('../../../lib/password')`, `vi.mock('../../../lib/jwt')` |
| E2E base URL | `PLAYWRIGHT_BASE_URL` env var (default: `http://localhost:5173`) — Phase 2 |

---

## 8. Deferred to Phase 2

| Test group | Test IDs | Blocked by |
|------------|----------|------------|
| Invite flow | auth-unit-10 through auth-unit-13 | POST /api/users/invite, POST /api/auth/accept-invite |
| Team management | auth-unit-14 through auth-unit-22 | GET/PUT/DELETE /api/users |
| Password reset | auth-unit-23 through auth-unit-27 | POST /api/auth/forgot-password, /reset-password |
| Invite integration | auth-int-07 through auth-int-21 | Phase 2 repository methods |
| E2E — invite / team / reset | auth-e2e-11 through auth-e2e-26 | Frontend pages (Phase 2) |
