# Feature Spec: Lead Management

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Lead Management |
| Module | Module 4 |
| Priority | P0 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Capture incoming prospects before they are qualified into a deal. The Leads Inbox is the first stop for every new opportunity — it keeps unqualified prospects separate from the active deal pipeline so reps have a clear qualification queue. Converting a qualified lead creates a deal, ensuring a clean audit trail from first contact to closed revenue.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Create lead
**As a** Sales Rep,
**I want to** create a lead manually,
**So that** I can capture a new prospect immediately without losing the context.

### 4.2 View leads inbox
**As a** Sales Rep,
**I want to** see all my open leads in a list,
**So that** I can work through my qualification queue efficiently.

### 4.3 View lead detail
**As a** Sales Rep,
**I want to** open a lead and see its full detail, activities, and notes,
**So that** I have context on the prospect before reaching out.

### 4.4 Update lead status
**As a** Sales Rep,
**I want to** change a lead's status (e.g. New → Contacted),
**So that** I can track where it is in the qualification process.

### 4.5 Convert lead to deal
**As a** Sales Rep,
**I want to** convert a qualified lead into a deal in a selected pipeline stage,
**So that** the opportunity enters the sales pipeline.

### 4.6 Disqualify lead
**As a** Sales Rep,
**I want to** disqualify a lead,
**So that** it is removed from my active queue without being deleted.

### 4.7 Filter leads by owner and status
**As a** Manager,
**I want to** filter leads by owner and status,
**So that** I can see which reps have unworked leads that need attention.

---

## 5. Acceptance Criteria

### AC-01: Create lead with title
**Given** a Sales Rep opens the create lead form and enters a title,
**When** the form is submitted,
**Then** the lead is created with status = "new" and owner_id = the submitting user.

### AC-02: Leads inbox scoped to org
**Given** a logged-in user,
**When** they view the leads list,
**Then** they see only leads with organization_id matching their JWT.

### AC-03: Sales Rep sees own leads
**Given** a user with role sales_rep,
**When** they view the leads list with default filters,
**Then** they see only leads where owner_id = their user ID.

### AC-04: Default filter excludes disqualified and converted
**Given** the leads inbox is opened with no filters applied,
**When** the list is displayed,
**Then** only leads with status = "new" or status = "contacted" are shown.

### AC-05: Convert lead creates deal
**Given** a Sales Rep selects "Convert to Deal" on a lead and selects a pipeline stage,
**When** they confirm the conversion,
**Then** a deal is created with the lead's title and value, the lead's converted_at is set to now, and lead status becomes "converted".

### AC-06: Converted deal linked to lead
**Given** a lead has been converted,
**When** the lead is viewed,
**Then** the deal created from it is displayed with a link to the deal detail page.

### AC-07: Lead cannot be converted twice
**Given** a lead with status = "converted",
**When** a user attempts to convert it again,
**Then** the system returns 422 with message "This lead has already been converted."

### AC-08: Disqualify lead
**Given** a Sales Rep sets a lead's status to "disqualified",
**When** the leads inbox is viewed with default filters,
**Then** the disqualified lead does not appear.

### AC-09: Manager sees all org leads
**Given** a user with role manager or admin,
**When** they view the leads list,
**Then** they see all non-deleted leads in the organisation (regardless of owner).

---

## 6. Out of Scope (MVP)

- Web form / lead capture form (external form that creates leads automatically)
- Lead import via CSV
- Lead scoring (automatic or manual)
- Automatic lead assignment rules (round-robin)
- Lead source tracking from URL parameters

---

## 7. Data Requirements

### Entities involved
- **Lead**: primary entity; created, updated, converted, disqualified
- **Deal**: created on conversion; linked to lead via deals.lead_id and leads.converted_deal_id
- **Contact**: optional link via lead.contact_id
- **Company**: optional link via lead.company_id

### New fields (if any)

All fields from the existing entity spec at `specs/database/entities/lead.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Lead | title | VARCHAR(255) | Yes | |
| Lead | value | DECIMAL(12,2) | No | Default 0 |
| Lead | status | ENUM | Yes | new, contacted, qualified, disqualified, converted |
| Lead | source | ENUM | No | lead_source enum |
| Lead | owner_id | UUID | Yes | FK → users.id |
| Lead | contact_id | UUID | No | FK → contacts.id, SET NULL on delete |
| Lead | company_id | UUID | No | FK → companies.id, SET NULL on delete |
| Lead | converted_at | TIMESTAMPTZ | No | Set on conversion |
| Lead | converted_deal_id | UUID | No | FK → deals.id (added via ALTER TABLE) |

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/leads | List leads (paginated, filterable by status/owner) | Yes |
| POST | /api/leads | Create lead | Yes |
| GET | /api/leads/:id | Get lead detail | Yes |
| PUT | /api/leads/:id | Update lead (title, value, status, owner, etc.) | Yes |
| DELETE | /api/leads/:id | Soft-delete lead | Yes — Admin only |
| POST | /api/leads/:id/convert | Convert lead to deal | Yes |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Leads inbox page (`/leads`) | List view with status badges; owner/status filters; "Convert" and "Disqualify" row actions |
| Lead detail drawer | Right-side panel: full lead fields, activities tab, notes tab |
| Create lead form | Title, value, source, contact (optional), company (optional) |
| Convert to deal modal | Pipeline stage selector (required); inherits title and value from lead |

---

## 10. Business Rules

- **BR-01**: A lead can only be converted once. Attempting to convert a lead with status = "converted" returns 422.
- **BR-02**: A converted lead record is never deleted — it is retained as an audit trail.
- **BR-03**: A lead must have a title. All other fields are optional.
- **BR-04**: The Leads Inbox default view shows only status = "new" and "contacted". Disqualified and converted leads are hidden by default.
- **BR-05**: Lead conversion requires a pipeline stage to be selected — a deal cannot be created without a stage.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create lead without title | 400 "Title is required." |
| Convert already-converted lead | 422 "This lead has already been converted." |
| Convert lead without selecting a stage | 400 "Pipeline stage is required." |
| Non-admin deletes lead | 403 "Only admins can delete leads." |
| Lead ID not found in org | 404 "Lead not found." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View leads list (all) | ✅ | ✅ | ❌ (own only) |
| View leads list (own) | ✅ | ✅ | ✅ |
| View lead detail | ✅ | ✅ | ✅ (own only) |
| Create lead | ✅ | ✅ | ✅ |
| Update lead | ✅ | ✅ | ✅ (own only) |
| Convert lead to deal | ✅ | ✅ | ✅ (own only) |
| Disqualify lead | ✅ | ✅ | ✅ (own only) |
| Delete lead | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec | `specs/ui/leads-inbox.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1leads` |
| DB entity spec | `specs/database/entities/lead.md` |
| DB spec | `specs/features/lead-management/db-spec.md` |
| Test spec | `specs/features/lead-management/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should converting a lead automatically link the newly created deal to the lead's contact and company? | Product | — | Resolved: Yes — the deal inherits contact_id and company_id from the lead |
