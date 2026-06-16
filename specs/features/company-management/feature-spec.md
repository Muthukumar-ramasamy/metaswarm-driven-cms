# Feature Spec: Company Management

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Company Management |
| Module | Module 3 |
| Priority | P0 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Track the organisations that contacts work for and that deals are being sold into. A company record aggregates all the people and deals at a given account, giving reps full context when engaging an account. Without companies, contacts and deals exist in isolation and account-level visibility is impossible.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Create company
**As a** Sales Rep,
**I want to** create a company record,
**So that** I can group related contacts and deals under one account.

### 4.2 View company list
**As a** Sales Rep,
**I want to** see a list of all companies in the organisation,
**So that** I can navigate to any account quickly.

### 4.3 View company detail
**As a** Sales Rep,
**I want to** open a company and see all its contacts, deals, and activities,
**So that** I have full account context before any engagement.

### 4.4 Edit company
**As a** Sales Rep,
**I want to** update a company's details,
**So that** information such as industry, size, and website stays current.

### 4.5 Delete company
**As an** Admin,
**I want to** soft-delete a company,
**So that** I can remove test or duplicate records without losing linked contact history.

---

## 5. Acceptance Criteria

### AC-01: Create company
**Given** a Sales Rep submits the create company form with a name,
**When** the form is submitted,
**Then** the company is created with organization_id set to the submitting user's org and owner_id set to the submitting user.

### AC-02: Company name unique per org
**Given** a company named "Acme Corp" already exists in the organisation,
**When** a user creates a second company with the same name in the same org,
**Then** the system returns 409 with message "A company with this name already exists."

### AC-03: Company list scoped to org
**Given** a logged-in user,
**When** they view the company list,
**Then** they see only non-deleted companies belonging to their organisation.

### AC-04: Company detail shows contacts
**Given** a company has linked contacts,
**When** a user opens the company detail page,
**Then** all contacts with company_id = this company's id are shown in the Contacts tab.

### AC-05: Company detail shows activities
**Given** a company has linked activities,
**When** a user opens the company detail page,
**Then** all activities with company_id = this company's id are shown in the Activities tab.

### AC-06: Soft delete company
**Given** an Admin soft-deletes a company,
**When** the company list is retrieved,
**Then** the deleted company does not appear, but the record exists with deleted_at set.

### AC-07: Contacts unlinked on company delete
**Given** a company with linked contacts is soft-deleted,
**When** the linked contacts are retrieved,
**Then** they still exist and their company_id is null.

---

## 6. Out of Scope (MVP)

- Company hierarchy (parent / subsidiary accounts)
- Company enrichment (auto-fill from domain / Clearbit)
- Custom fields on companies
- Company import via CSV
- Bulk actions

---

## 7. Data Requirements

### Entities involved
- **Company**: primary entity; new records created and updated
- **Contact**: company_id SET NULL when company is deleted
- **Deal**: company_id is an optional FK on deals

### New fields (if any)

All fields from the existing entity spec at `specs/database/entities/company.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Company | name | VARCHAR(255) | Yes | Unique per org (partial index excl. soft-deleted) |
| Company | website | VARCHAR(255) | No | |
| Company | industry | VARCHAR(100) | No | |
| Company | employee_count | INTEGER | No | |
| Company | owner_id | UUID | Yes | FK → users.id |
| Company | notes | TEXT | No | |

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/companies | List companies (paginated, searchable) | Yes |
| POST | /api/companies | Create company | Yes |
| GET | /api/companies/:id | Get company detail (with contacts, deals, activities) | Yes |
| PUT | /api/companies/:id | Update company | Yes |
| DELETE | /api/companies/:id | Soft-delete company | Yes — Admin only |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Companies list page (`/companies`) | Paginated table with search; right-side create drawer |
| Company detail page (`/companies/:id`) | Three tabs: Contacts, Activities, Notes; deals sidebar panel |
| Create/edit company drawer | Form: name, website, industry, employee count, owner |

---

## 10. Business Rules

- **BR-01**: Company name must be unique within an organisation. The uniqueness check excludes soft-deleted companies.
- **BR-02**: Deleting a company does not delete its contacts — it only sets their company_id to null (SET NULL).
- **BR-03**: A Sales Rep can only edit companies they own. Managers and Admins can edit any company in the org.
- **BR-04**: Companies are always scoped by organisation_id. No cross-tenant access is possible.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create company with duplicate name (same org) | 409 "A company with this name already exists." |
| Sales Rep edits company they do not own | 403 "You do not have permission to edit this company." |
| Non-admin attempts to delete a company | 403 "Only admins can delete companies." |
| Company ID does not exist in org | 404 "Company not found." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View company list | ✅ | ✅ | ✅ |
| View company detail | ✅ | ✅ | ✅ |
| Create company | ✅ | ✅ | ✅ |
| Edit own company | ✅ | ✅ | ✅ |
| Edit any company | ✅ | ✅ | ❌ |
| Reassign owner | ✅ | ✅ | ❌ |
| Delete company | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec (list) | `specs/ui/companies-list.md` |
| UI spec (detail) | `specs/ui/company-detail.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1companies` |
| DB entity spec | `specs/database/entities/company.md` |
| DB spec | `specs/features/company-management/db-spec.md` |
| Test spec | `specs/features/company-management/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should all roles see all companies, or should Sales Reps see own companies only (like contacts)? | Product | — | Resolved: all roles see all companies (companies are account-level, not personal) |
