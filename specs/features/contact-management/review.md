# Feature Review: Contact Management

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes

---

## Spec compliance

### Backend

**Routes / Controller** — all checks passed ✅

- All 5 endpoints from api-spec.md present in `routes.ts`: `GET /contacts`, `POST /contacts`, `GET /contacts/:id`, `PUT /contacts/:id`, `DELETE /contacts/:id`
- No extra endpoints outside the spec
- HTTP methods, paths, and response envelopes all match
- Validation: `createContactSchema`, `updateContactSchema`, `listContactsQuerySchema` applied in `controller.ts` before service call
- Status codes correct: 201 POST create, 200 GET/PUT, 204 DELETE, 400/403/404/409 via typed error classes → global error handler
- No business logic in `controller.ts` — parse/call/respond pattern followed ✅

**Service** — 2 issues found ⚠️

All BRs enforced:
- BR-01 (email unique per org): `findByEmail` check in `createContact` and `updateContact` (`service.ts` lines 22-25, 86-90) ✅
- BR-02 (soft delete only): `repo.softDelete` in `deleteContact` (`service.ts` line 118) ✅
- BR-03 (sales rep edits own only): ownership check in `updateContact` (`service.ts` lines 75-77) ✅
- BR-04 (sales rep scoped to own contacts): `ownerId` forced to `caller.sub` in `listContacts` (`service.ts` line 9) ✅
- BR-05 (org scoping): `caller.organizationId` always passed to repo, never from body/params ✅
- Email normalised to lowercase on create (`service.ts` line 39) ✅
- Admin-only delete enforced (`service.ts` lines 111-113) ✅
- Sales rep cannot reassign owner (`service.ts` lines 80-82) ✅

Gaps:

- **⚠️ Issue 1**: `feature-spec.md` Error Cases lists `company_id references non-existent company → 400 "Invalid company ID."` but `service.ts` has no validation for this. Deferred until CompanyManagement module is implemented. Spec reference: `feature-spec.md §11 Error Cases`.

- **⚠️ Issue 2**: `ForbiddenError` is thrown without a custom message at three points in `service.ts`, so the API returns the default `"Insufficient permissions"` message. The `feature-spec.md` Error Cases table specifies different messages:
  - Sales rep edits unowned contact (`service.ts` line 76): spec expects `"You do not have permission to edit this contact."`
  - Sales rep attempts owner reassign (`service.ts` line 82): spec expects `"You do not have permission to edit this contact."`
  - Non-admin delete (`service.ts` line 112): spec expects `"Only admins can delete contacts."`
  
  Fix: pass the message string to `ForbiddenError(message)` at each of these three throw sites.
  Spec reference: `feature-spec.md §11 Error Cases`, `backend/src/lib/errors.ts` (ForbiddenError accepts optional message param).

**Repository / Schema** — 2 issues found ⚠️

Fields:
- All required fields present in `backend/src/db/schema/contacts.ts`: id, organization_id, first_name, last_name, email, phone, job_title, company_id, owner_id, source, linkedin_url, created_at, updated_at, deleted_at ✅
- `linkedin_url` present in schema and migration (acceptable addition aligned with feature-spec.md §7) ✅
- `deleted_at` present and nullable ✅

- **⚠️ Issue 3**: `db-spec.md §2 Key Fields` lists `notes: TEXT` as a field on contacts. `contacts.ts` and `20260613000002_create_contacts.sql` both omit it. Notes are stored in a separate Notes entity (Module 7), which is the correct architecture — but `db-spec.md` was not updated to reflect this. The spec and implementation are inconsistent. Either (a) remove the `notes` row from `db-spec.md §2`, or (b) add a clarifying note: "Stored in the `notes` table (Module 7), not as a direct column on contacts." Spec reference: `db-spec.md §2 Key Fields`.

- **⚠️ Issue 4**: `company_id` in `contacts.ts` (line 21) declares a plain `uuid('company_id')` with no `.references()` call. `db-spec.md §3 Relationships` requires `FK → companies.id, ON DELETE SET NULL`. The migration SQL also omits the FK constraint on `company_id` (a placeholder `UUID` without `REFERENCES`). When CompanyManagement is built this FK must be added via a new migration. Spec reference: `db-spec.md §3 Relationships`.

Indexes:
- `contacts_org_idx`, `contacts_owner_idx`, `contacts_company_idx`, `contacts_deleted_at_idx` — all present ✅
- Partial unique index `(organization_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL` — correctly defined in migration SQL (`20260613000002_create_contacts.sql` lines 22-24) ✅
- **⚠️ Issue 5**: `contacts.ts` line 36 uses `index()` for `emailOrgIdx` rather than a partial unique index. Drizzle ORM does not support partial `WHERE` clauses on indexes, so the uniqueness constraint can only live in the migration SQL — which is correct. App-level enforcement via `findByEmail` in `service.ts` provides a second layer. A code comment should be added to explain this limitation so future developers do not try to rely on the Drizzle index definition for uniqueness. Spec reference: `db-spec.md §4 Critical Constraints`.

### Frontend — 2 issues found ⚠️

Contacts list page (`ContactsPage.tsx`):
- Search bar (TextField) ✅
- Owner filter shown for admin/manager only (`canFilterByOwner` flag at line 57) ✅
- "+ New contact" opens right-side Drawer ✅
- Row click navigates to `/contacts/:id` (via `ContactTable`) ✅
- Loading: CircularProgress ✅
- Error: Alert severity="error" ✅
- Empty state: "No contacts found." + "Add your first contact" button ✅
- Pagination component present ✅

Contact table columns (`ContactTable.tsx`): Name (Avatar + text), Email, Phone, Job title, Owner (Chip) — all from ui-spec.md ✅

Delete in kebab menu hidden for non-admin (`authUser?.role === 'admin'` in `ContactTable.tsx` line 107) ✅

Contact detail page (`ContactDetailPage.tsx`):
- Two-panel Grid (info left, tabs right) ✅
- Breadcrumbs ✅
- Edit button opens ContactForm Drawer ✅
- Admin-only Delete button hidden for non-admin roles ✅
- Deals, Activities, Notes tabs ✅
- Loading and error states ✅

Gaps:

- **⚠️ Issue 6**: The Owner filter `<Select>` in `ContactsPage.tsx` (lines 83-93) only contains one static `<MenuItem value="">All owners</MenuItem>` item. The `ui-spec.md` requires filtering by owner for admin/manager users. The control renders but cannot select a real owner until a users-list call is added. Spec reference: `ui-spec.md §Key UI Behaviours — owner filter`.

- **⚠️ Issue 7**: `ui-spec.md` line 28 specifies "Edit fields inline; save button appears on change." The implementation uses a ContactForm right-side Drawer instead. `feature-spec.md §9` specifies "right-side create drawer", which aligns with the implementation. The `ui-spec.md` is inconsistent with `feature-spec.md` on this point. Fix: update `ui-spec.md` to replace "Edit fields inline; save button appears on change" with "Edit button opens a right-side Drawer (ContactForm)." Spec reference: `ui-spec.md §Contact detail`.

---

## Security invariants

✅ All invariants passed — no blocking violations.

**Multi-tenancy** — all repository functions include `organization_id` scope:

| Function | Clause | File location |
|----------|--------|---------------|
| `findMany` | `eq(contacts.organizationId, organizationId)` | `repository.ts:24` |
| `findById` | `eq(contacts.organizationId, organizationId)` | `repository.ts:92-94` |
| `findByEmail` | `eq(contacts.organizationId, organizationId)` | `repository.ts:107` |
| `create` | `organizationId` carried in `NewContact` from `caller.organizationId` | `service.ts:32` |
| `update` | `eq(contacts.organizationId, organizationId)` | `repository.ts:134-136` |
| `softDelete` | `eq(contacts.organizationId, organizationId)` | `repository.ts:150-152` |

`organizationId` sourced only from `getJwtPayload(req)` in `controller.ts` — never from `req.body` or `req.params` ✅

**Soft delete** — zero `DELETE FROM` statements. Every `SELECT` includes `isNull(contacts.deletedAt)`. `softDelete` uses `UPDATE SET deletedAt = new Date()` ✅

**Auth** — `authenticate` preHandler on all 5 routes (`routes.ts` lines 6-10) ✅

**Role checks** — all role enforcement in `service.ts`, none in `routes.ts` or `controller.ts` ✅

**Data exposure** — no `password_hash`, `invite_token`, or `reset_token` on the Contact entity; none appear in any response or log call ✅

**Input safety** — Drizzle ORM used throughout, no raw SQL string interpolation. The `sql<string>` template literals in `enrichedFields` (`repository.ts` lines 51-52) reference only column identifiers from the Drizzle schema, never user input ✅

---

## Test coverage

⚠️ 1 accepted gap (AC-07).

**AC coverage**:

| AC | Description | Status |
|----|-------------|--------|
| AC-01 | Create contact with name only | ✅ |
| AC-02 | Email uniqueness enforced | ✅ |
| AC-03 | Contact list scoped to org | ✅ |
| AC-04 | Sales rep sees own contacts only | ✅ |
| AC-05 | Manager sees all contacts | ✅ |
| AC-06 | Search by name | ✅ |
| AC-07 | Link contact to company | ⚠️ Skipped — CompanyManagement not yet implemented. Documented in `test-spec.md §7 Coverage Gaps` with explanation. Will be covered in the CompanyManagement E2E suite. |
| AC-08 | Soft delete | ✅ |
| AC-09 | Reassign owner | ✅ (backend covered; E2E is smoke-only — owner-select UI not yet built) |
| AC-10 | Contact detail shows related records | ✅ |

**BR coverage** — BR-01 through BR-05: all have unit + integration tests ✅

**Permission coverage** — all 11 permission rows have both ALLOWED and DENIED tests ✅

**Multi-tenancy isolation**:
- GET /contacts: `contacts-int-02` ✅
- GET /contacts/:id: `contacts-int-get-org-isolation` ✅

**Soft delete**:
- Not in list after delete: `contacts-int-10` ✅
- Record still in DB with `deleted_at` set: `contacts-int-11` ✅

**Form validation E2E**:
- Required field empty → inline error: `contacts-e2e-form-required` ✅
- API 409 → inline conflict error (not generic toast): `contacts-e2e-02` ✅

---

## Code quality

✅ All checks passed.

**TypeScript** — Zero `any` in `service.ts`, `repository.ts`, `controller.ts`, frontend hooks, `api.ts`, `types.ts`. (`as unknown[]` for placeholder related-record arrays is typed, not `any`; `as ContactRow[]` cast in `repository.ts` is an acceptable Drizzle inference workaround.) ✅

**Layer separation**:
- `routes.ts`: registers routes only, no logic ✅
- `controller.ts`: parse → call service → send response, zero business logic ✅
- `service.ts`: all business logic, calls `repo.*` only, zero Drizzle queries ✅
- `repository.ts`: all Drizzle queries, zero business logic ✅

**Frontend patterns**: all API calls via `api` instance from `../../lib/api` (no direct `fetch()`), all role checks via `useAuth()` (no hardcoded role strings in JSX conditions) ✅

**Error handling**: `ConflictError`, `ForbiddenError`, `NotFoundError` used throughout; no untyped `throw new Error(...)` in `service.ts` ✅

**Naming**: module folder `contact-management` matches feature kebab slug; files follow `routes.ts / controller.ts / service.ts / repository.ts / schemas.ts` convention; components PascalCase; hooks prefixed with `use` ✅

---

## Required changes before merge

5 issues total. Issues 3 and 4 are blocking because they represent mismatches between the db-spec and implementation that will cause problems when dependent modules are built. All others are minor.

1. **[Minor — Issue 1]** Add `company_id` existence validation to `backend/src/modules/contact-management/service.ts` once CompanyManagement is implemented. When `companyId` is provided in create or update input, verify it exists in the org; throw `new ValidationError('Invalid company ID.')` (400) if not.
   Spec: `feature-spec.md §11 Error Cases`.

2. **[Minor — Issue 2]** Fix `ForbiddenError` messages in `backend/src/modules/contact-management/service.ts`:
   - Line ~76 (sales rep edits unowned contact): `throw new ForbiddenError('You do not have permission to edit this contact.')`
   - Line ~82 (sales rep reassigns owner): `throw new ForbiddenError('You do not have permission to edit this contact.')`
   - Line ~112 (non-admin delete): `throw new ForbiddenError('Only admins can delete contacts.')`
   Spec: `feature-spec.md §11 Error Cases`.

3. **[Blocking — Issue 3]** Resolve the `notes` field discrepancy. Either (a) remove the `notes: TEXT` row from `specs/features/contact-management/db-spec.md §2`, adding a clarification that notes are stored in the `notes` table (Module 7); or (b) add the column to `backend/src/db/schema/contacts.ts` and `backend/drizzle/20260613000002_create_contacts.sql` (or a new migration). Option (a) is architecturally correct.
   Spec: `db-spec.md §2 Key Fields`.

4. **[Blocking — Issue 4]** Add `company_id` FK to `backend/src/db/schema/contacts.ts` and a migration once CompanyManagement creates the `companies` table. In `contacts.ts`, change the `companyId` column to: `companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' })`.
   Spec: `db-spec.md §3 Relationships`.

5. **[Minor — Issues 5 and 7]** Two documentation fixes:
   - Add a code comment on `emailOrgIdx` in `backend/src/db/schema/contacts.ts` line ~36 explaining that partial unique constraint enforcement lives in the migration SQL only (Drizzle does not support partial index WHERE clauses).
   - Update `specs/features/contact-management/ui-spec.md` to replace "Edit fields inline; save button appears on change" with "Edit button opens a right-side Drawer (ContactForm)." The feature-spec and implementation both use a Drawer; ui-spec.md is the outlier.
   Spec: `db-spec.md §4 Critical Constraints`; `ui-spec.md §Contact detail`.
