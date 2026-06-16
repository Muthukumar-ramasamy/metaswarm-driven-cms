# Test Spec: Contact Management

---

## 1. AC Coverage Map

| AC ID | Description | Unit | Integration | E2E |
|-------|-------------|------|-------------|-----|
| AC-01 | Create contact with name only | contacts-unit-01 | contacts-int-05 | contacts-e2e-01, contacts-e2e-01b, contacts-e2e-form-required |
| AC-02 | Email uniqueness enforced | contacts-unit-03 | contacts-int-06 | contacts-e2e-02 |
| AC-03 | Contact list scoped to org | contacts-unit-05 | contacts-int-02, contacts-int-get-org-isolation | contacts-e2e-03 |
| AC-04 | Sales Rep sees own contacts only | contacts-unit-05 | contacts-int-sales-rep-scoped | contacts-e2e-03 |
| AC-05 | Manager sees all contacts | contacts-unit-06 | contacts-int-manager-all | contacts-e2e-05 |
| AC-06 | Search by name | — | contacts-int-04 | contacts-e2e-06 |
| AC-07 | Link contact to company | — | — | skipped (Company Management not yet built) |
| AC-08 | Soft delete | contacts-unit-11 | contacts-int-10, contacts-int-11 | contacts-e2e-04, contacts-e2e-04b |
| AC-09 | Reassign owner | contacts-unit-16 | contacts-int-manager-reassign | contacts-e2e-09 (smoke) |
| AC-10 | Contact detail shows related records | contacts-unit-13 | contacts-int-get-owned | contacts-e2e-10, contacts-e2e-10b |

---

## 2. BR Coverage Map

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | Email unique per org when set | contacts-unit-03, contacts-unit-17, contacts-int-06 |
| BR-02 | Soft delete only — never hard delete | contacts-unit-11, contacts-int-10, contacts-int-11 |
| BR-03 | Sales rep can only edit own contacts | contacts-unit-09, contacts-int-09 |
| BR-04 | Sales rep list scoped to own contacts | contacts-unit-05, contacts-int-sales-rep-scoped |
| BR-05 | Contacts scoped to org — cross-tenant impossible | contacts-int-02, contacts-int-get-org-isolation |

---

## 3. Permission Coverage

| Role | Action | Allowed | Denied |
|------|--------|---------|--------|
| Admin | Create contact | contacts-int-05 | — |
| Manager | Create contact | contacts-e2e-05 (implicit) | — |
| Sales Rep | Create contact | contacts-e2e-01 | — |
| Sales Rep | Edit own contact | contacts-int-08 | — |
| Sales Rep | Edit another's contact | — | contacts-int-09 |
| Sales Rep | Reassign owner | — | contacts-int-09b |
| Manager | Reassign owner | contacts-int-manager-reassign | — |
| Admin | Delete contact | contacts-int-10 | — |
| Manager | Delete contact | — | contacts-int-12 |
| Sales Rep | Delete contact | — | contacts-int-12b |
| Admin | Delete button visible | contacts-e2e-04 | — |
| Manager | Delete button hidden | contacts-e2e-04b | — |
| Sales Rep | Delete button hidden on detail | contacts-e2e-perm-01 | — |

---

## 4. Unit Tests

**File**: `backend/src/modules/contacts/__tests__/contacts.service.test.ts`

| Test ID | Description | BR / AC |
|---------|-------------|---------|
| contacts-unit-01 | Creates contact with name only (no email) | AC-01, BR-01 |
| contacts-unit-02 | Creates contact with all fields | AC-01 |
| contacts-unit-03 | Throws ConflictError for duplicate email in org | AC-02, BR-01 |
| contacts-unit-04 | Sales rep owner_id forced to caller.userId (from req.user — not sub) | AC-01 |
| contacts-unit-04b | Normalises email to lowercase on create | BR-01 |
| contacts-unit-05 | Sales rep only sees own contacts (ownerId forced) | AC-04, BR-04 |
| contacts-unit-06 | Manager sees all org contacts | AC-05 |
| contacts-unit-07 | Returns pagination meta alongside data | AC-02 |
| contacts-unit-08 | Owner can update their contact | AC-06 (edit), BR-03 |
| contacts-unit-09 | Throws ForbiddenError when sales rep edits another rep's contact | BR-03 |
| contacts-unit-10 | Manager can edit any contact in the org | AC-09 |
| contacts-unit-11 | Admin can soft-delete a contact | AC-08, BR-02 |
| contacts-unit-12 | Throws ForbiddenError when manager attempts delete | AC-08 |
| contacts-unit-12b | Throws ForbiddenError when sales_rep attempts delete | AC-08 |
| contacts-unit-13 | Returns contact with empty related arrays | AC-10 |
| contacts-unit-14 | Throws ForbiddenError (403, same message as wrong-owner) when contact not found — never 404 | Error Cases |
| contacts-unit-15 | Sales rep cannot view contact they do not own | Permissions Matrix |
| contacts-unit-16 | Sales rep cannot reassign owner | AC-09 |
| contacts-unit-17 | Throws ConflictError when updating to a taken email | BR-01 |
| contacts-unit-18 | Throws ForbiddenError (403) on delete of non-existent contact — same response as non-admin delete | Error Cases |
| contacts-unit-04c | Admin/manager create without ownerId in body — defaults to caller.userId | BR-06 |
| contacts-unit-17b | Manager reassign to userId from another org — throws ForbiddenError | BR-07 |
| contacts-unit-19 | updateContact with email already used by a different contact in same org — throws ConflictError | BR-01 |

---

## 5. Integration Tests

**File**: `backend/src/modules/contacts/__tests__/contacts.repository.test.ts`

| Test ID | Description | AC / BR |
|---------|-------------|---------|
| contacts-int-01 | Returns paginated list for authenticated user | AC-01 |
| contacts-int-02 | Org isolation — org B cannot see org A contacts | AC-03, BR-05 |
| contacts-int-03 | Soft-deleted contacts not returned | AC-08, BR-02 |
| contacts-int-04 | Search by partial name returns matching contacts | AC-06 |
| contacts-int-sales-rep-scoped | Sales rep only sees own contacts | AC-04, BR-04 |
| contacts-int-manager-all | Manager sees all org contacts | AC-05 |
| contacts-int-05 | Returns 201 for valid body | AC-01 |
| contacts-int-06 | Returns 409 for duplicate email in org | AC-02, BR-01 |
| contacts-int-07 | Returns 400 for missing first_name | Validation |
| contacts-int-unauth | Returns 401 without token | Security |
| contacts-int-get-owned | Owner can view own contact | AC-10 |
| contacts-int-get-forbidden | Sales rep cannot view another rep's contact | Permissions |
| contacts-int-get-404 | Returns 403 for non-existent contact (never 404 — identical response prevents IDOR) | Error Cases |
| contacts-int-get-org-isolation | Cannot view contact from another org | AC-03, BR-05 |
| contacts-int-08 | Owner can update their contact | BR-03 |
| contacts-int-09 | Returns 403 when sales rep edits another rep contact | BR-03 |
| contacts-int-09b | Returns 403 when sales rep tries to reassign owner | Permissions |
| contacts-int-manager-reassign | Manager can reassign contact owner | AC-09 |
| contacts-int-10 | Admin soft-deletes; contact not in list | AC-08, BR-02 |
| contacts-int-11 | Record still in DB with deleted_at set after soft delete | AC-08, BR-02 |
| contacts-int-12 | Returns 403 for manager delete attempt | Permissions |
| contacts-int-12b | Returns 403 for sales rep delete attempt | Permissions |

---

## 6. E2E Tests

**File**: `e2e/contact-management.spec.ts`

| Test ID | Description | AC |
|---------|-------------|----|
| contacts-e2e-01 | Sales rep creates contact with first name only; appears in list | AC-01 |
| contacts-e2e-01b | Admin creates contact with all fields; appears in list | AC-01 |
| contacts-e2e-form-required | Submitting empty form shows required-field error | AC-01 |
| contacts-e2e-02 | Duplicate email shows inline conflict error | AC-02 |
| contacts-e2e-03 | Sales rep cannot see another rep's contacts | AC-04 |
| contacts-e2e-05 | Manager sees contacts from all reps in the org | AC-05 |
| contacts-e2e-06 | Partial name search returns matching contacts | AC-06 |
| contacts-e2e-04 | Admin deletes contact; disappears from list | AC-08 |
| contacts-e2e-04b | Delete option is hidden for manager | AC-08, Permissions |
| contacts-e2e-09 | Manager reassigns contact (smoke test) | AC-09 |
| contacts-e2e-10 | Contact detail page shows info panel and related tabs | AC-10 |
| contacts-e2e-10b | Non-existent contact detail page shows error state | Error Cases |
| contacts-e2e-perm-01 | Delete button hidden on detail page for sales rep | Permissions |
| contacts-e2e-empty | Contacts page shows empty state when no contacts match | UX |

---

## 7. Coverage Gaps

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC-07: Link contact to company | Company Management feature not yet implemented | Will be covered in contacts-e2e-07 once CompanyManagement is implemented |

---

## 8. Test Environment

| Requirement | Value |
|-------------|-------|
| Database | Neon test DB (separate from prod) |
| Auth tokens | `createTestToken(user)` from `backend/src/test/helpers.ts` |
| Cleanup | `afterAll: cleanupOrg(orgId)` |
| E2E credentials | `E2E_ADMIN_EMAIL`, `E2E_MANAGER_EMAIL`, `E2E_REP_A_EMAIL`, `E2E_REP_B_EMAIL` env vars |

---

## 9. Implementation Prerequisites (before WU-2 and WU-7)

| Prerequisite | File | Notes |
|-------------|------|-------|
| Test token helper | `backend/src/test/helpers.ts` | Export `createTestToken(user: {userId, organizationId, role}): string`. Calls `signToken({ sub: user.userId, organizationId: user.organizationId, role: user.role })` from `backend/src/lib/jwt.ts`. |
| Companies stub schema | `backend/src/db/schema/companies.ts` | Minimal Drizzle table definition needed so contacts.company_id FK can reference it. Must be imported in `backend/src/db/index.ts`. |
| Contacts schema registered | `backend/src/db/index.ts` | Spread `contactsSchema` and `companiesSchema` into the `drizzle()` call alongside existing schemas. |
| Companies table in Neon | Neon DB | User confirmed companies table already exists. If not, run companies migration before contacts migration. |

---

## 10. Critical Implementation Rules (from Design Review Gate)

| Rule | Detail |
|------|--------|
| `req.user.userId` | All service and controller code must read `req.user.userId` — NOT `req.user.sub`. The `authenticate` middleware maps JWT `sub` → `req.user.userId`. |
| 403 identical for not-found and wrong-owner | `getContact`, `updateContact`, `deleteContact`: return the SAME 403 ForbiddenError whether the contact doesn't exist or the caller doesn't own it. Never 404. |
| email lowercase | Normalize email to lowercase before uniqueness check and before saving. |
| deals and activities as empty arrays | `getContact` response must include `deals: []` and `activities: []`. No Notes field in response. |
| Route relative paths | `contacts.routes.ts` uses `/contacts` and `/:id` — not `/api/contacts`. Registered with `app.register(contactsRoutes, { prefix: '/api' })`. |
| `ok()` wrapper | `return reply.send(ok(contact))` — not `ok({ data: contact })`. |
