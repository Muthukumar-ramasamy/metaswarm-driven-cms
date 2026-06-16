# Feature Review: CompanyManagement

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes (2 minor issues, 0 blocking violations)

---

## Spec compliance

### Backend

**Routes / Controller** — cross-referenced against `specs/features/company-management/api-spec.md`

| Check | Result |
|-------|--------|
| All 5 endpoints implemented | ✅ |
| No extra endpoints | ✅ |
| HTTP methods match | ✅ |
| Route paths match exactly | ✅ |
| Request validation via Zod (createCompanySchema, updateCompanySchema, listCompaniesQuerySchema) | ✅ |
| List response `{ data, pagination }` | ✅ |
| Create response `{ data: company }` + 201 | ✅ |
| Detail/Update responses `{ data: company }` | ✅ |
| Delete response 204 empty | ✅ |
| Error codes 409 / 403 / 404 map correctly | ✅ |

**Service** — cross-referenced against `specs/features/company-management/feature-spec.md`

| Check | Result |
|-------|--------|
| BR-01 (name unique per org): checked in `createCompany` (service.ts:24-27) and `updateCompany` (service.ts:86-91) | ✅ |
| BR-02 (contacts unlinked on delete): `deleteCompany` calls `unlinkCompanyContacts` (service.ts:125) | ✅ |
| BR-03 (sales rep edits own company only): enforced at service.ts:76-78; ownerId reassignment blocked at service.ts:81-83 | ✅ |
| BR-04 (org scoped): all service functions use `caller.organizationId` (from JWT) | ✅ |
| Error cases: ConflictError 409, ForbiddenError 403, NotFoundError 404 | ✅ |
| Permissions Matrix: delete admin-only; edit any = admin/manager; edit own = sales_rep | ✅ |

✅ All backend spec compliance checks passed.

**Repository / Schema** — cross-referenced against `specs/features/company-management/db-spec.md`

| Check | Result |
|-------|--------|
| All 11 db-spec.md fields in `backend/src/db/schema/companies.ts` | ✅ |
| UUID PK (`uuid().primaryKey().defaultRandom()`) | ✅ |
| organization_id FK → organizations (CASCADE) | ✅ |
| owner_id FK → users (RESTRICT) | ✅ |
| `deleted_at` nullable TIMESTAMPTZ | ✅ |
| Indexes: org_idx, owner_idx, name_org_idx, deleted_at_idx | ✅ |
| Partial unique index in migration SQL | ✅ — see Issue 1 |

⚠️ **Issue 1** (minor): `backend/src/db/schema/companies.ts:35` — `nameOrgIdx` uses `index()` instead of `uniqueIndex()`. Drizzle ORM cannot express partial (WHERE-clause) unique indexes, so the uniqueness constraint is not reflected at the ORM layer. The migration SQL at `backend/drizzle/20260613000003_create_companies.sql:16-18` correctly creates `CREATE UNIQUE INDEX companies_name_org_unique_idx ON companies (organization_id, name) WHERE deleted_at IS NULL`, so the database enforces the constraint. The BR-01 check in service.ts provides a second application-layer guard. This is acceptable — document with an inline comment for future readers (same as ContactManagement Issue 3).

Spec reference: `db-spec.md — Critical Constraints`

### Frontend

**CompaniesPage / CompanyDetailPage** — cross-referenced against `specs/features/company-management/ui-spec.md`

| Check | Result |
|-------|--------|
| All columns rendered: Name, Website, Industry, Employees, Owner | ✅ |
| Search filter implemented (TextField → filters.search) | ✅ |
| No owner-scoping filter (all roles see all companies) | ✅ |
| "+ New company" button opens right-side Drawer | ✅ |
| Edit action in kebab menu | ✅ |
| Delete action: hidden for non-admin (CompanyTable.tsx:120, CompanyDetailPage.tsx:76) | ✅ |
| Detail page: three tabs (Contacts, Activities, Notes) | ✅ |
| Loading: CircularProgress | ✅ |
| Error: Alert | ✅ |
| Empty state: "No companies found." | ✅ |

✅ All frontend spec compliance checks passed.

---

## Security invariants

**Multi-tenancy** — all repository functions scoped by `organizationId`:

| Function | Org scope |
|----------|-----------|
| `findMany` | `buildWhere` → `eq(companies.organizationId, organizationId)` |
| `findById` | `eq(companies.organizationId, organizationId)` |
| `findByName` | `eq(companies.organizationId, organizationId)` |
| `update` | `eq(companies.organizationId, organizationId)` |
| `softDelete` | `eq(companies.organizationId, organizationId)` |
| `unlinkCompanyContacts` | `eq(contacts.organizationId, organizationId)` |

`organizationId` always sourced from `caller.organizationId` (JWT payload) — never from `req.body` or `req.params`. ✅

**Soft delete** — verified across all repository functions:

| Check | Result |
|-------|--------|
| Zero `DELETE FROM` in repository.ts | ✅ |
| `findMany` — `isNull(companies.deletedAt)` in `buildWhere` | ✅ |
| `findById` — `isNull(companies.deletedAt)` | ✅ |
| `findByName` — `isNull(companies.deletedAt)` | ✅ |
| `update` — `isNull(companies.deletedAt)` guards the WHERE | ✅ |
| `softDelete` — `set({ deletedAt: new Date() })` | ✅ |
| `unlinkCompanyContacts` — `isNull(contacts.deletedAt)` | ✅ |

**Auth / Role checks:**
- `authenticate` preHandler on all 5 routes ✅
- Role checks only in `service.ts`, not controller or routes ✅
- ForbiddenError thrown for manager/sales_rep on delete ✅

**Data exposure:** No password_hash, invite_token, or reset_token in any company response ✅

**Input safety:** Drizzle ORM parameterized queries only; `ilike` uses `${filters.search}` inside Drizzle template (safe) ✅

✅ All security invariants passed — zero blocking violations.

---

## Test coverage

**AC coverage** — all 7 ACs have unit + integration + E2E tests:

| AC | Unit | Integration | E2E |
|----|------|-------------|-----|
| AC-01 (Create) | companies-unit-01/01b/01c | companies-int-01b | companies-e2e-01/01b/form-required |
| AC-02 (Unique name) | companies-unit-02 | companies-int-02 | companies-e2e-02 |
| AC-03 (List scoped) | companies-unit-03/04 | companies-int-03/all-roles/search | companies-e2e-03 |
| AC-04 (Detail contacts) | companies-unit-detail-ok | companies-int-get-detail | companies-e2e-04 |
| AC-05 (Detail activities) | companies-unit-detail-ok | companies-int-get-detail | companies-e2e-04 |
| AC-06 (Soft delete) | companies-unit-05 | companies-int-04/soft-delete-excluded/deleted-in-db | companies-e2e-03b |
| AC-07 (Contacts unlinked) | companies-unit-07 | companies-int-contacts-unlinked | companies-e2e-07 |

**BR coverage:**

| BR | Tests |
|----|-------|
| BR-01 (unique name) | companies-unit-02, companies-unit-update-conflict, companies-int-02 |
| BR-02 (contacts unlinked) | companies-unit-07, companies-int-contacts-unlinked |
| BR-03 (rep edits own) | companies-unit-update-forbidden, companies-unit-update-no-reassign, companies-int-06, companies-int-no-reassign-rep |
| BR-04 (org scoping) | companies-unit-03, companies-int-03, companies-int-get-org-isolation |

**Permission coverage:** All 8 permission rows have both ALLOWED and DENIED tests ✅

**Isolation tests:**
- GET /list: `companies-int-03` (org B cannot see org A) ✅
- GET /:id: `companies-int-get-org-isolation` ✅

**Soft delete tests:**
- Excluded from list: `companies-int-soft-delete-excluded` ✅
- Still in DB with `deleted_at` set: `companies-int-deleted-in-db` ✅

**Form validation (E2E):**
- Empty required field: `companies-e2e-form-required` ✅
- API 409 conflict inline error: `companies-e2e-02` ✅

✅ Full test coverage — no gaps.

---

## Code quality

**TypeScript:**
- `service.ts`: no `any`; uses typed `JWTPayload`, `CreateCompanyInput`, `UpdateCompanyInput`, `ListCompaniesQuery` ✅
- `repository.ts`: no `any`; `CompanyRow` type defined; `as CompanyRow[]` and `as CompanyRow | undefined` casts are acceptable Drizzle inference workarounds ✅
- `controller.ts`: no `any`; `FastifyRequest<{ Params: { id: string } }>` generics used ✅
- Frontend `api.ts`, `types.ts`, `schemas.ts`, `hooks/`: no `any`; `unknown[]` for `contacts`/`deals` is correct pending future module integration ✅

**Layer separation:**
- `routes.ts`: registration only ✅
- `controller.ts`: parse → call service → respond ✅
- `service.ts`: business logic only, zero DB queries ✅
- `repository.ts`: Drizzle queries only, zero business logic ✅

**Frontend patterns:**
- All API calls via `api` from `../../lib/api` ✅
- No hardcoded URLs, no `fetch()` ✅
- Role checks via `useAuth()` everywhere ✅
- Zod schemas in `schemas.ts` match api-spec.md request bodies ✅

**Error handling:**
- `ConflictError`, `ForbiddenError`, `NotFoundError` from `lib/errors.ts` ✅
- No untyped `throw new Error(...)` in service.ts ✅
- Fastify global error handler maps `statusCode` property correctly ✅

**Naming:** `company-management` folder, `companies.ts` schema, PascalCase components, `use*` hooks ✅

⚠️ **Issue 2** (minor): `backend/drizzle/20260613000003_create_companies.sql:26-33` — The migration adds an unused column `company_id_fk UUID REFERENCES companies(id) ON DELETE SET NULL` to the contacts table. This column does not appear in the contacts Drizzle schema, is not referenced anywhere in the application, and is dead code in production. The note in the migration explains that BR-02 is handled at the service layer — but the `ALTER TABLE` statement should be removed entirely rather than left as an orphaned column.

Fix: Remove lines 26-33 from the migration file. The `-- Note:` comment (lines 28-33) can be kept or removed at the author's discretion.

---

## Required changes before merge

1. **[companies.ts:35]** Add an inline comment to `nameOrgIdx` explaining the Drizzle partial-index limitation:
   ```typescript
   // Drizzle cannot express partial (WHERE-clause) indexes; uniqueness enforced by migration SQL
   nameOrgIdx: index('companies_name_org_idx').on(table.organizationId, table.name),
   ```
   Spec reference: `db-spec.md — Critical Constraints`

2. **[20260613000003_create_companies.sql:26-33]** Remove the dead `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id_fk ...` block. Keep only the note comment if desired. The `company_id_fk` column has no corresponding Drizzle schema definition and is never used by the application.

Both issues are minor with no security or data integrity impact. Neither is a blocking violation under the SDD invariant rules. The feature may be considered functionally complete pending these two cleanup items.
