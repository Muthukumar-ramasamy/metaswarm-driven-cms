# Active Plan — ContactManagement (Module 2, P0)
<!-- approved: 2026-06-16 -->
<!-- gate-iterations: 2 + Codex cross-review -->
<!-- user-approved: pending -->
<!-- status: in-progress -->

## Overview
Implements Module 2 (P0): Contact CRUD with RBAC (3 roles), soft-delete, owner reassignment via PUT, and org isolation. Backend: 5 endpoints across 4-layer arch. Frontend: list + detail pages + create/edit drawer with routing. 20 unit tests + pure-repo integration tests + HTTP smoke tests. Requires `contacts` table migration to Neon and minimal `companies` stub schema.

## camelCase / snake_case convention
- **DB layer** (Drizzle schema columns): `snake_case` — `first_name`, `owner_id`, `company_id`, `deleted_at`
- **TypeScript / API layer** (service, controller, request/response): `camelCase` — `firstName`, `ownerId`, `companyId`, `deletedAt`
- Drizzle maps column names automatically when using the column alias pattern (`first_name` column → `firstName` in TypeScript select results via Drizzle's field mapping). All API input/output uses camelCase matching the OpenAPI spec and frontend types.

## Execution Position
- Current WU: WU-1 (not started)
- Completed WUs: none

## Work Units

### WU-1: Prerequisites
**Files (NEW):**
- `backend/src/test/helpers.ts` — exports `createTestToken(user: {userId, organizationId, role}): string`. Calls `signToken({ sub: user.userId, organizationId, role })` from `backend/src/lib/jwt.ts`.
- `backend/src/db/schema/companies.ts` — minimal stub Drizzle table: id (uuid pk defaultRandom()), organizationId (uuid not null), name (text not null), deletedAt (timestamp nullable). Required as FK target for contacts.companyId. **Also add a companies migration SQL** so fresh test DBs have the table.

**Migration:** `backend/drizzle/{timestamp}_create_companies_stub.sql`
```sql
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deleted_at TIMESTAMPTZ
);
```
`IF NOT EXISTS` ensures it's safe to run even if the table already exists in Neon (user confirmed table exists).

**DoD:** helpers.ts exports createTestToken; companies.ts compiles; companies migration runs idempotently.

---

### WU-2: Write contacts.service.test.ts (TDD RED — 20 named unit tests)
**File:** `backend/src/modules/contacts/__tests__/contacts.service.test.ts`

All 20 tests must EXIST and FAIL:
- contacts-unit-01: createContact — firstName only (no email)
- contacts-unit-02: createContact — all fields
- contacts-unit-03: createContact — ConflictError for duplicate email in org
- contacts-unit-04: createContact — sales_rep: ownerId forced = caller.userId ignoring body
- contacts-unit-04b: createContact — email normalized to lowercase
- contacts-unit-04c: createContact — admin/manager: ownerId defaults to caller.userId when not in body
- contacts-unit-05: listContacts — sales_rep forced ownerId = caller.userId
- contacts-unit-06: listContacts — manager sees all (no owner filter)
- contacts-unit-07: listContacts — returns {data, pagination: {page,limit,total}}
- contacts-unit-08: updateContact — sales_rep (owner) updates own contact
- contacts-unit-09: updateContact — ForbiddenError when sales_rep updates another rep's contact
- contacts-unit-10: updateContact — manager can update any org contact
- contacts-unit-11: deleteContact — admin soft-deletes (calls repo.softDelete)
- contacts-unit-12: deleteContact — ForbiddenError for manager
- contacts-unit-12b: deleteContact — ForbiddenError for sales_rep
- contacts-unit-13: getContact — returns contact with deals: [] and activities: []
- contacts-unit-14: getContact — ForbiddenError (403, not 404) for non-existent contact
- contacts-unit-15: getContact — sales_rep gets SAME 403 for contact they don't own
- contacts-unit-16: updateContact — sales_rep with ownerId in body → ForbiddenError
- contacts-unit-17: updateContact — manager with ownerId in body → succeeds (reassign)
- contacts-unit-17b: updateContact — manager reassign throws ForbiddenError if new owner not in same org
- contacts-unit-18: deleteContact — ForbiddenError (403) for non-existent contact
- contacts-unit-19: updateContact — throws ConflictError when updating email to one already used in org

**Note:** contacts-unit-04c, contacts-unit-17b, contacts-unit-19 are new tests added from Codex cross-review.

Mock pattern: `vi.mock('../contacts.repository')` at top; `vi.mocked()` for typed access; `vi.clearAllMocks()` in beforeEach.

**DoD:** All tests exist and FAIL when run (service module not yet created).

---

### WU-3: contacts.schemas.ts (Zod validation)
**File:** `backend/src/modules/contacts/contacts.schemas.ts`

Exports (all fields camelCase to match API contract):
- `CreateContactBodySchema` — firstName required; lastName, email, phone, jobTitle, companyId, source, notes, ownerId all optional
- `UpdateContactBodySchema` — all optional including ownerId (for reassign)
- `ContactParamsSchema` — id (UUID)
- `ContactQuerySchema` — page, limit, sort, order, search, ownerId

**Validation location:** Zod parsing happens in the **controller** (parse body/query/params before passing to service), NOT via Fastify's built-in JSON Schema.

**DoD:** File compiles; `tsc --noEmit` passes.

---

### WU-4: backend/src/db/schema/contacts.ts (Drizzle entity)
**File:** `backend/src/db/schema/contacts.ts`

Contents:
- `contactSourceEnum` = pgEnum('contact_source', ['website','referral','social_media','cold_outreach','event','other'])
- `contacts` table columns (snake_case column names, camelCase TypeScript field names via Drizzle alias):
  - id, organizationId, firstName, lastName, email, phone, jobTitle, companyId, ownerId, source, notes, createdAt, updatedAt, deletedAt
- Indexes: organizationId, ownerId, companyId, deletedAt, email (for ILIKE search performance)
- Partial unique index: `(organization_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL`

FK cascade rules:
- organizationId → organizations.id CASCADE
- companyId → companies.id SET NULL (nullable)
- ownerId → users.id RESTRICT

**DoD:** File compiles; `npx drizzle-kit generate` produces SQL without errors.

---

### WU-5: Update backend/src/db/index.ts
**File:** `backend/src/db/index.ts` (EXISTING — UPDATE)

Spread `contactsSchema` and `companiesSchema` into the drizzle() call alongside existing schemas.

**DoD:** `backend/src/db/index.ts` compiles; drizzle instance has contacts table type.

---

### WU-6: DB migration — contacts table (Neon)
**File:** `backend/drizzle/{timestamp}_create_contacts.sql`

```sql
CREATE TYPE contact_source AS ENUM ('website','referral','social_media','cold_outreach','event','other');
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source contact_source,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX contacts_org_email_unique_idx ON contacts (organization_id, email)
  WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX contacts_org_idx ON contacts (organization_id);
CREATE INDEX contacts_owner_idx ON contacts (owner_id);
CREATE INDEX contacts_company_idx ON contacts (company_id);
CREATE INDEX contacts_deleted_idx ON contacts (deleted_at);
CREATE INDEX contacts_email_idx ON contacts (email);
```

**Dependency:** WU-1 companies migration must run first.

**DoD:** Migration runs without error; `\d contacts` shows all columns, indexes.

---

### WU-7: Write contacts.repository.test.ts (TDD RED — pure repository tests only)
**File:** `backend/src/modules/contacts/__tests__/contacts.repository.test.ts`

**CRITICAL (Codex finding):** This file contains ONLY pure Drizzle repository function tests — direct calls to `list()`, `findById()`, `create()`, `update()`, `softDelete()`, `findByEmail()`. No `app.inject()` / HTTP-level tests here. HTTP-level tests go to WU-11b.

Tests (pure repo layer, ~16 tests):
- repo-list-01: list() returns paginated rows for org
- repo-list-02: list() excludes deleted_at IS NOT NULL rows
- repo-list-03: list() filters by ownerId when provided
- repo-list-04: list() ILIKE search on firstName, lastName, email (case-insensitive)
- repo-list-05: list() org isolation — returns only rows for given orgId
- repo-list-06: list() returns total count for pagination
- repo-create-01: create() inserts and returns row with generated id
- repo-create-02: findByEmail() confirms email uniqueness in same org
- repo-findById-01: findById() returns row for correct org+id
- repo-findById-02: findById() returns undefined for wrong org
- repo-findById-03: findById() returns undefined for deleted row
- repo-update-01: update() changes specified fields; unchanged fields preserved
- repo-update-02: update() sets updatedAt to new value
- repo-softDelete-01: softDelete() sets deleted_at; row still in DB
- repo-softDelete-02: softDelete() means row no longer returned by list()
- repo-softDelete-03: softDelete() returns undefined for non-existent id (or the contact for cleanup)

Uses: `createTestToken` from `backend/src/test/helpers.ts`; direct DB import from `backend/src/db/index.ts`.

**DoD:** All 16 tests exist and FAIL (contacts table doesn't exist yet until WU-6 migration runs, or repo functions not implemented).

---

### WU-8: Implement contacts.repository.ts (WU-7 → GREEN)
**File:** `backend/src/modules/contacts/contacts.repository.ts`

Exports (all inputs/outputs in camelCase):
- `list(orgId, filter: {ownerId?, search?, page, limit, sort, order})` → `{rows: Contact[], total: number}`
- `findById(orgId, id)` → `Contact | undefined`
- `findByEmail(orgId, email)` → `Contact | undefined`
- `create(data: CreateContactData)` → `Contact`
- `update(orgId, id, data: UpdateContactData)` → `Contact`
- `softDelete(orgId, id)` → `Contact | undefined`

All queries: WHERE organizationId = orgId AND deletedAt IS NULL (except softDelete which sets it).

**DoD:** All 16 WU-7 pure repo tests pass.

---

### WU-9: Implement contacts.service.ts (WU-2 → GREEN)
**File:** `backend/src/modules/contacts/contacts.service.ts`

Business logic (all camelCase):

- `createContact(caller, body)`:
  - Normalize email to lowercase if present
  - If email: findByEmail → ConflictError if found
  - Set ownerId: sales_rep always = caller.userId; admin/manager = body.ownerId ?? caller.userId
  - Call repo.create

- `listContacts(caller, query)`:
  - Force ownerId = caller.userId for sales_rep
  - Call repo.list → return {data: rows, pagination}

- `getContact(caller, id)`:
  - findById(caller.organizationId, id)
  - If undefined OR (sales_rep AND contact.ownerId !== caller.userId): throw AppError('FORBIDDEN','Access denied',403)
  - Return {...contact, deals: [], activities: []}

- `updateContact(caller, id, body)`:
  - Same 403 fetch pattern as getContact
  - If sales_rep AND body.ownerId: throw AppError('FORBIDDEN','Cannot reassign owner',403)
  - If (admin/manager) AND body.ownerId: validate new owner exists in caller.organizationId (query users table); throw AppError('FORBIDDEN','New owner not in organization',403) if not found
  - If body.email: findByEmail → ConflictError if different contact has same email in org
  - Call repo.update

- `deleteContact(caller, id)`:
  - If caller.role !== 'admin': throw AppError('FORBIDDEN','Only admins can delete contacts',403)
  - findById → if undefined: throw AppError('FORBIDDEN','Access denied',403) (not 404)
  - Call repo.softDelete

**CRITICAL:** Use `caller.userId` — NOT `caller.sub`.

**DoD:** All WU-2 unit tests pass.

---

### WU-10: contacts.routes.ts + contacts.controller.ts
**Files:**
- `backend/src/modules/contacts/contacts.routes.ts` — Fastify plugin with RELATIVE paths (/contacts, /:id); all routes behind `authenticate`; NO Fastify JSON Schema (Zod parsed in controller)
- `backend/src/modules/contacts/contacts.controller.ts` — parses Zod schemas for body/query/params; reads req.user (userId, organizationId, role); calls service; wraps in `ok(result)` (NOT `ok({ data: result })`)

Response shapes (camelCase throughout):
- POST: `reply.send(ok(contact))` — 201
- GET list: `reply.send(ok({ contacts, pagination: {page,limit,total} }))`
- GET :id: `reply.send(ok({...contact, deals:[], activities:[]}))`
- PUT: `reply.send(ok(contact))`
- DELETE: `reply.send(ok({ id }))`

**DoD:** Routes compile; `tsc --noEmit` passes.

---

### WU-11: Wire into app.ts
**File:** `backend/src/app.ts` (EXISTING — UPDATE)

Add: `app.register(contactsRoutes, { prefix: '/api' })` alongside existing authRoutes.

**DoD:** `npm run dev` starts; backend responds on port 3000.

---

### WU-11b: HTTP smoke + integration tests (go GREEN after WU-11)
These are the HTTP-level scenarios from the original integration test list that require the full stack (routes + controller + service + repo + app). They can be added as additional describe blocks within `contacts.repository.test.ts` OR as a separate smoke run post-wiring:

Key HTTP scenarios to verify (manual or via inject):
- POST /api/contacts without token → 401
- POST /api/contacts with missing firstName → 400
- GET /api/contacts with valid token → 200, empty array
- POST /api/contacts → 201 with created contact
- GET /api/contacts/:id for non-existent → 403
- DELETE /api/contacts/:id by non-admin → 403

**DoD:** All 6 scenarios pass using `app.inject()` from `buildApp()`. Integrate into `contacts.repository.test.ts` as a `describe('HTTP smoke')` block run AFTER WU-11 wiring.

---

### WU-12: Coverage Gate (BLOCKING)
**Command (from project root):**
```
npx vitest run --coverage --coverage.include="backend/src/modules/**/*.ts" --coverage.include="backend/src/lib/**/*.ts" --coverage.include="backend/src/middleware/**/*.ts" --coverage.exclude="**/__tests__/**"
```

Required thresholds (.coverage-thresholds.json): lines >= 65%, branches >= 70%, functions >= 50%, statements >= 65%

Thresholds are checked manually against the JSON summary output — vitest will print coverage table; verify each metric meets threshold before proceeding.

**DoD:** All 4 thresholds pass. BLOCKING — WU-13 cannot start until this passes.

---

### WU-13: Frontend + App.tsx routing
**Files (all NEW under `frontend/src/features/contacts/`):**
- `types/contacts.types.ts` — Contact interface (camelCase: firstName, ownerId, companyId, etc.)
- `schemas/contacts.schemas.ts` — Zod schemas for form validation
- `api/contacts.api.ts` — axios/fetch wrapper; reads token from localStorage; all fields camelCase
- `hooks/useContacts.ts` — TanStack Query v5 hooks
- `pages/ContactsListPage.tsx` — MUI table, search input, "New Contact" button, pagination
- `pages/ContactDetailPage.tsx` — info panel, deals tab (empty state), activities tab (empty state); Delete button HIDDEN (not disabled) for non-admin
- `components/CreateEditContactDrawer.tsx` — MUI Drawer + React Hook Form + Zod; firstName required only

**App.tsx routing update (EXISTING file — UPDATE):**
Add routes for `/contacts` and `/contacts/:id` behind `<ProtectedRoute>` in `frontend/src/App.tsx`.

**TDD note:** E2E tests (14 scenarios in `e2e/contact-management.spec.ts`) are a separate future phase handled by `/generate-tests`. Frontend has no unit tests in this WU — consistent with test-spec.md section 6 which specifies only E2E tests for the frontend layer.

**DoD:** `/contacts` page loads and shows empty state; "New Contact" drawer opens and validates firstName; delete button hidden for manager/sales_rep role.

---

## Plan Metadata

| Item | Value |
|------|-------|
| Gate iterations | 2 (Plan Review Gate) + 1 (Codex cross-review) |
| Feasibility | PASS |
| Completeness | PASS |
| Scope & Alignment | PASS |
| Codex cross-review | NEEDS_REVISION → addressed (8 blockers fixed) |
| Total WUs | 14 (WU-1 through WU-13, plus WU-11b) |
| Unit tests | 23 (added contacts-unit-04c, 17b, 19) |
| Pure repo integration tests | 16 |
| HTTP smoke tests | 6 |
| Coverage gate position | After WU-11b, before WU-13 |

## Codex Fixes Applied

| # | Codex Blocker | Fix |
|---|---------------|-----|
| 1 | WU-7→WU-8 dependency broken (HTTP tests need full stack) | Split: WU-7 = pure repo tests only; HTTP tests → WU-11b after app is wired |
| 2 | Admin/manager owner_id NOT NULL on create | WU-9: ownerId = body.ownerId ?? caller.userId for admin/manager |
| 3 | Reassign org isolation missing | WU-9: validate new owner exists in caller.organizationId before reassign |
| 4 | Duplicate email on UPDATE unhandled | WU-9: updateContact calls findByEmail; throws ConflictError if taken |
| 5 | camelCase/snake_case unaddressed | Plan header + WU-3/WU-8/WU-9/WU-10 all explicitly state camelCase API |
| 6 | App.tsx routing missing in WU-13 | WU-13 now explicitly includes App.tsx routing update |
| 7 | Frontend TDD unclear | WU-13 explicitly notes E2E is future phase per test-spec.md section 6 |
| 8 | Companies migration not guaranteed | WU-1 adds `CREATE TABLE IF NOT EXISTS companies` migration SQL |
