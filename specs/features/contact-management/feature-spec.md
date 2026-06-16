# Feature Spec: Contact Management

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Contact Management |
| Module | Module 2 |
| Priority | P0 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Give sales reps a searchable, persistent record of every person they sell to. A contact is the individual human in every deal and conversation. Without contacts, reps have no way to track who they spoke to, when, or what was discussed. The contact record is the anchor for activities, notes, and deals.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Create contact
**As a** Sales Rep,
**I want to** create a contact record with at minimum a first name,
**So that** I have a permanent record of a person I am selling to.

### 4.2 View contact list
**As a** Sales Rep,
**I want to** see a list of contacts I own,
**So that** I can find who I need to follow up with today.

### 4.3 View all contacts (manager view)
**As a** Manager or Admin,
**I want to** see all contacts in the organisation,
**So that** I have full visibility into the team's relationships.

### 4.4 Search contacts
**As a** Sales Rep,
**I want to** search contacts by name, email, or phone,
**So that** I can find a specific person quickly without scrolling.

### 4.5 View contact detail
**As a** Sales Rep,
**I want to** open a contact and see all their associated deals, activities, and notes,
**So that** I have the full relationship history before a call.

### 4.6 Edit contact
**As a** Sales Rep,
**I want to** update a contact's details,
**So that** the record stays accurate as the relationship evolves.

### 4.7 Link contact to company
**As a** Sales Rep,
**I want to** link a contact to a company,
**So that** I can see all the people at a given account in one place.

### 4.8 Delete contact
**As an** Admin,
**I want to** soft-delete a contact,
**So that** I can remove records created by mistake without losing the history.

### 4.9 Reassign contact owner
**As a** Manager,
**I want to** reassign a contact to a different rep,
**So that** accounts are covered when a team member leaves or changes focus.

---

## 5. Acceptance Criteria

### AC-01: Create contact with name only
**Given** a Sales Rep opens the create contact form and enters a first name,
**When** the form is submitted,
**Then** the contact is created with organization_id and owner_id set to the submitting user, and appears in the contact list.

### AC-02: Email uniqueness enforced
**Given** a contact with email `sam@co.com` already exists in the organisation,
**When** a new contact is created with the same email in the same organisation,
**Then** the system returns 409 with message "A contact with this email already exists."

### AC-03: Contact list scoped to org
**Given** a logged-in Sales Rep,
**When** they view the contact list,
**Then** they see only contacts with organization_id matching their JWT.

### AC-04: Sales Rep sees own contacts only
**Given** a user with role sales_rep,
**When** they view the contact list,
**Then** they see only contacts where owner_id = their user ID.

### AC-05: Manager sees all contacts
**Given** a user with role manager or admin,
**When** they view the contact list,
**Then** they see all non-deleted contacts in the organisation.

### AC-06: Search by name
**Given** contacts exist in the organisation,
**When** a user searches by partial name (e.g. "joh"),
**Then** all contacts whose first name or last name contains that string (case-insensitive) are returned.

### AC-07: Link contact to company
**Given** a contact exists and a company exists in the same org,
**When** the contact is edited to set company_id,
**Then** the contact appears in the company's contacts list on the company detail page.

### AC-08: Soft delete
**Given** an Admin soft-deletes a contact,
**When** the contact list is retrieved,
**Then** the deleted contact does not appear, but the record exists in the database with deleted_at set.

### AC-09: Reassign owner
**Given** a Manager updates a contact's owner_id to a different user,
**When** the Sales Rep who now owns it views their contact list,
**Then** that contact appears in their list.

### AC-10: Contact detail shows related records
**Given** a user opens a contact detail page,
**When** the contact is fetched,
**Then** the response includes `deals: []` and `activities: []` as empty arrays.
**Note:** The Notes relation is excluded until the Notes module (Module 7) is implemented. The Notes tab on the detail page is out of scope for this module.

---

## 6. Out of Scope (MVP)

- Contact merge / deduplication
- Custom fields on contacts
- Contact import via CSV
- Email sync / email history
- Contact scoring
- Bulk actions (bulk delete, bulk reassign)

---

## 7. Data Requirements

### Entities involved
- **Contact**: primary entity; new records created and updated
- **Company**: optional link via company_id on contact
- **User**: owner_id references users.id; created_by references users.id

### New fields (if any)

All fields come from the existing entity spec at `specs/database/entities/contact.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Contact | first_name | VARCHAR(255) | Yes | |
| Contact | last_name | VARCHAR(255) | No | |
| Contact | email | VARCHAR(255) | No | Unique per org when set |
| Contact | phone | VARCHAR(50) | No | |
| Contact | job_title | VARCHAR(255) | No | |
| Contact | company_id | UUID | No | FK → companies.id, SET NULL on company delete |
| Contact | owner_id | UUID | Yes | FK → users.id |
| Contact | source | ENUM | No | contact_source enum |
| Contact | notes | TEXT | No | |

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/contacts | List contacts (paginated, filtered) | Yes |
| POST | /api/contacts | Create contact | Yes |
| GET | /api/contacts/:id | Get contact detail (with deals: [], activities: []) | Yes |
| PUT | /api/contacts/:id | Update contact | Yes |
| DELETE | /api/contacts/:id | Soft-delete contact | Yes — Admin only |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Contacts list page (`/contacts`) | Paginated table with search, filter by owner; right-side create drawer |
| Contact detail page (`/contacts/:id`) | Two-panel: info panel + deals panel (empty state); tab for Activities (empty state). Notes tab excluded — Notes module not yet built. |
| Create/edit contact drawer | Form with first name, last name, email, phone, company (searchable select), owner |

---

## 10. Business Rules

- **BR-01**: A contact's email, if provided, must be unique within the organisation. Contacts without email are allowed. Email uniqueness is enforced on both CREATE and UPDATE.
- **BR-02**: A contact can never be hard-deleted. Deletion always sets deleted_at.
- **BR-03**: A Sales Rep can only edit contacts they own. Managers and Admins can edit any contact in the org.
- **BR-04**: Only Admins can delete contacts. Managers and Sales Reps receive 403 on any delete attempt.
- **BR-05**: Contacts are always scoped to the organisation. Cross-tenant access is impossible.
- **BR-06**: `owner_id` defaults to the caller's user ID when not specified. Sales Reps cannot set a different owner. Managers and Admins can specify any owner within the same org.
- **BR-07**: When reassigning a contact's owner, the new owner must belong to the same organisation. Cross-org owner assignment returns 403.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create contact with duplicate email (in same org) | 409 "A contact with this email already exists." |
| Sales Rep edits contact they do not own | 403 "You do not have permission to edit this contact." |
| Non-admin attempts to delete a contact | 403 "Only admins can delete contacts." |
| Contact ID does not exist in org, or caller is a sales_rep who does not own it | 403 "Access denied." (identical response — never 404, prevents IDOR enumeration) |
| company_id references non-existent company | 400 "Invalid company ID." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View contact list (all) | ✅ | ✅ | ❌ (own only) |
| View contact list (own) | ✅ | ✅ | ✅ |
| View contact detail | ✅ | ✅ | ✅ (own only) |
| Create contact | ✅ | ✅ | ✅ |
| Edit own contact | ✅ | ✅ | ✅ |
| Edit any contact | ✅ | ✅ | ❌ |
| Reassign owner | ✅ | ✅ | ❌ |
| Delete contact | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec (list) | `specs/ui/contacts-list.md` |
| UI spec (detail) | `specs/ui/contact-detail.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1contacts` |
| DB entity spec | `specs/database/entities/contact.md` |
| DB spec | `specs/features/contact-management/db-spec.md` |
| Test spec | `specs/features/contact-management/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Can a Manager delete contacts, or is delete Admin-only? | Product | — | Resolved: Admin-only delete (consistent with all other entities) |
