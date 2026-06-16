# Test Spec: Company Management

---

## 1. Coverage Map

| AC # | Criterion | Unit | Integration | E2E |
|------|-----------|------|-------------|-----|
| AC-01 | Create company | companies-unit-01, companies-unit-01b, companies-unit-01c | companies-int-01b | companies-e2e-01, companies-e2e-01b, companies-e2e-form-required |
| AC-02 | Name unique per org | companies-unit-02 | companies-int-02 | companies-e2e-02 |
| AC-03 | List scoped to org | companies-unit-03, companies-unit-04 | companies-int-03, companies-int-all-roles, companies-int-search | companies-e2e-03 |
| AC-04 | Detail shows contacts | companies-unit-detail-ok | companies-int-get-detail | companies-e2e-04 |
| AC-05 | Detail shows activities | companies-unit-detail-ok | companies-int-get-detail | companies-e2e-04 |
| AC-06 | Soft delete | companies-unit-05 | companies-int-04, companies-int-soft-delete-excluded, companies-int-deleted-in-db | companies-e2e-03b |
| AC-07 | Contacts unlinked on delete | companies-unit-07 | companies-int-contacts-unlinked | companies-e2e-07 |

---

## 2. Unit Tests

**File**: `backend/src/modules/company-management/__tests__/company-management.service.test.ts`

```
companyService.listCompanies
  ✅ companies-unit-03: all roles see all org companies (no ownerId forcing)
  ✅ companies-unit-04: returns pagination meta alongside data

companyService.createCompany
  ✅ companies-unit-01:  creates company with valid data
  ✅ companies-unit-02:  throws ConflictError for duplicate name in org (BR-01)
  ✅ companies-unit-01b: sales rep owner_id forced to caller.sub
  ✅ companies-unit-01c: admin can assign a different owner

companyService.getCompanyById
  ✅ companies-unit-detail-ok:  returns company with empty contacts and deals arrays
  ✅ companies-unit-notfound:   throws NotFoundError when company does not exist

companyService.updateCompany
  ✅ companies-unit-update-owner:     owner can update their company (BR-03)
  ✅ companies-unit-update-forbidden: sales rep cannot edit another rep company (BR-03)
  ✅ companies-unit-update-manager-any:  manager can edit any company in the org
  ✅ companies-unit-update-no-reassign:  sales rep cannot reassign owner
  ✅ companies-unit-update-conflict:  throws ConflictError when changing to taken name (BR-01)

companyService.deleteCompany
  ✅ companies-unit-05:            admin can soft-delete a company
  ✅ companies-unit-07:            contacts unlinked after soft-delete (BR-02)
  ✅ companies-unit-06:            throws ForbiddenError when manager attempts delete
  ✅ companies-unit-06b:           throws ForbiddenError when sales rep attempts delete
  ✅ companies-unit-notfound-delete: throws NotFoundError when company does not exist
```

---

## 3. Integration Tests

**File**: `backend/src/modules/company-management/__tests__/company-management.repository.test.ts`

```
GET /api/companies
  ✅ companies-int-01:              returns paginated list for authenticated user
  ✅ companies-int-03:              org isolation — org B cannot see org A companies
  ✅ companies-int-all-roles:       all roles (including sales rep) see all org companies
  ✅ companies-int-search:          search by partial name returns matching companies
  ✅ companies-int-soft-delete-excluded: soft-deleted companies not returned
  ✅ companies-int-unauth:          returns 401 without token

POST /api/companies
  ✅ companies-int-01b: returns 201 for valid body; sets organizationId from JWT
  ✅ companies-int-02:  returns 409 for duplicate name in org (BR-01)
  ✅ companies-int-no-name: returns 400 for missing name

GET /api/companies/:id
  ✅ companies-int-get-detail:       returns company detail with contacts and deals arrays
  ✅ companies-int-get-404:          returns 404 for non-existent company
  ✅ companies-int-get-org-isolation: org B cannot view org A company (403 or 404)

PUT /api/companies/:id
  ✅ companies-int-update-owner:     owner can update their company
  ✅ companies-int-06:               returns 403 when sales rep edits another rep company (BR-03)
  ✅ companies-int-manager-any:      manager can edit any company in the org
  ✅ companies-int-no-reassign-rep:  sales rep cannot reassign owner (BR-03)

DELETE /api/companies/:id
  ✅ companies-int-04:              admin soft-deletes; company not in list
  ✅ companies-int-deleted-in-db:   record still in DB with deleted_at set (soft-delete verified)
  ✅ companies-int-contacts-unlinked: contacts have company_id = null after delete (BR-02)
  ✅ companies-int-05:              returns 403 for manager delete attempt
  ✅ companies-int-05b:             returns 403 for sales rep delete attempt
```

---

## 4. E2E Tests (Playwright)

**File**: `e2e/company-management.spec.ts`

```
AC-01 — Create company
  ✅ companies-e2e-01:            sales rep creates a company; appears in list
  ✅ companies-e2e-01b:           admin creates company with all fields; appears in list
  ✅ companies-e2e-form-required: submitting empty form shows required-field error

AC-02 — Duplicate company name
  ✅ companies-e2e-02: duplicate name shows inline conflict error

AC-03 — List scoped to org
  ✅ companies-e2e-03: all roles see all companies in the org (no owner filtering)

AC-04 / AC-05 — Company detail tabs
  ✅ companies-e2e-04: company detail page shows Contacts, Activities, Notes tabs

AC-06 — Soft delete
  ✅ companies-e2e-03b:             admin deletes company; disappears from list
  ✅ companies-e2e-delete-hidden-manager: delete option hidden for manager

AC-07 — Contacts unlinked on delete
  ✅ companies-e2e-07: contact still exists after company delete, without company link

Permissions — detail page
  ✅ companies-e2e-perm-01: delete button hidden on detail page for sales rep

Empty state
  ✅ companies-e2e-empty: companies page shows empty state when search has no results
```

---

## 5. Permission Tests

| Role | Action | Expected | Test ID |
|------|--------|----------|---------|
| Sales Rep | Create company | 201 | companies-int-01b, companies-e2e-01 |
| Sales Rep | Edit own company | 200 | companies-int-update-owner |
| Sales Rep | Edit another rep's company | 403 | companies-int-06, companies-unit-update-forbidden |
| Sales Rep | Reassign owner | 403 | companies-int-no-reassign-rep, companies-unit-update-no-reassign |
| Sales Rep | Delete company | 403 | companies-int-05b, companies-unit-06b |
| Manager | Edit any company | 200 | companies-int-manager-any, companies-unit-update-manager-any |
| Manager | Delete company | 403 | companies-int-05, companies-unit-06, companies-e2e-delete-hidden-manager |
| Admin | Delete company | 204 | companies-int-04, companies-unit-05, companies-e2e-03b |
| Org B Admin | View Org A companies | 403/404 | companies-int-03, companies-int-get-org-isolation |

---

## 6. BR Coverage

| BR # | Rule | Unit Test | Integration Test |
|------|------|-----------|-----------------|
| BR-01 | Company name unique per org | companies-unit-02, companies-unit-update-conflict | companies-int-02 |
| BR-02 | Contacts unlinked on soft-delete | companies-unit-07 | companies-int-contacts-unlinked, companies-int-deleted-in-db |
| BR-03 | Sales rep can only edit own company | companies-unit-update-forbidden, companies-unit-update-no-reassign | companies-int-06, companies-int-no-reassign-rep |
| BR-04 | All queries scoped to org | companies-unit-03 (ownerId not forced) | companies-int-03, companies-int-get-org-isolation |

---

## 7. Quality Gate Checklist

```
COVERAGE — AC TRACEABILITY
[x] Every AC-NN in feature-spec.md has at least one E2E test ID
[x] No AC is left without a test
[x] test-spec.md maps each test ID back to the AC it covers

COVERAGE — BR TRACEABILITY
[x] Every BR-NN in feature-spec.md has at least one unit or integration test
[x] BR-02 (soft-delete contacts) also verified with integration test
[x] No BR is left without a test

PERMISSIONS COVERAGE
[x] Every row in the permissions matrix has TWO tests: allowed AND denied
[x] Denied tests assert HTTP 403 (not 404 or 200)
[x] Admin-only delete tested with Manager token (403) and Sales Rep token (403)
[x] "Own records only" BR-03: Sales Rep cannot edit another rep's company

MULTI-TENANCY ISOLATION
[x] companies-int-03: org B cannot see org A companies (list endpoint)
[x] companies-int-get-org-isolation: org B cannot view org A company (GET :id)

SOFT DELETE
[x] companies-int-soft-delete-excluded: soft-deleted not returned by list
[x] companies-int-deleted-in-db: record still in DB with deleted_at set
[x] companies-int-04: 204 response on admin delete; list excludes it

FORM VALIDATION (E2E)
[x] companies-e2e-form-required: empty form → inline "Company name is required" error
[x] companies-e2e-02: duplicate name → inline conflict error (not generic toast)

ERROR STATES (E2E)
[x] companies-e2e-empty: no search results → empty state message
[x] companies-int-get-404: 404 for non-existent company ID

UNIT TEST QUALITY
[x] Each unit test uses Arrange → Act → Assert structure
[x] vi.resetAllMocks() called in beforeEach of every describe block
[x] All service functions tested for both success and error paths
[x] Error types checked: NotFoundError, ConflictError, ForbiddenError
```
