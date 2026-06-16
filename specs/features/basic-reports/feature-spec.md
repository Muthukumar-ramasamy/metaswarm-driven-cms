# Feature Spec: Basic Reports

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Basic Reports |
| Module | Module 8 |
| Priority | P1 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Give managers and admins a high-level view of pipeline health, revenue, and team activity without requiring a BI tool. These reports answer the four questions every sales leader asks every Monday morning: How many deals did we win? What is the pipeline worth? Who is the most active rep? Where are our leads coming from? Sales Reps see only their own data.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Deals won/lost report
**As a** Manager,
**I want to** see how many deals were won and lost in a given date range,
**So that** I can track team performance and revenue against targets.

### 4.2 Pipeline value report
**As a** Manager,
**I want to** see the total value of open deals broken down by pipeline stage,
**So that** I can forecast expected revenue for the quarter.

### 4.3 Activity report by rep
**As a** Manager,
**I want to** see the number of activities logged per rep in a given period,
**So that** I can identify the most and least active reps and coach accordingly.

### 4.4 Leads by source report
**As an** Admin,
**I want to** see how many leads came from each source,
**So that** I can assess which lead generation channels are working.

### 4.5 Sales Rep views own report data
**As a** Sales Rep,
**I want to** see report data for my own deals and activities,
**So that** I can track my own performance.

---

## 5. Acceptance Criteria

### AC-01: Deals report filtered by date range
**Given** a Manager views the deals won/lost report,
**When** they apply a date range filter (e.g. last 30 days),
**Then** only deals with won_at or lost_at within that date range are included in the counts.

### AC-02: Pipeline value scoped to org
**Given** a user views the pipeline value report,
**When** the data is returned,
**Then** only deals with organization_id = the user's org and status = "open" are included.

### AC-03: Pipeline value grouped by stage
**Given** a user views the pipeline value report,
**When** the data is returned,
**Then** the total deal value is shown per stage, in stage display_order order.

### AC-04: Activity report by rep
**Given** a Manager selects a specific rep and date range,
**When** the activity report is requested,
**Then** only activities where owner_id = that rep's ID and created_at is within the date range are counted.

### AC-05: Leads by source
**Given** leads exist with various source values,
**When** the leads by source report is viewed,
**Then** the count of leads is shown per source enum value, for the selected date range.

### AC-06: Sales Rep sees own data only
**Given** a user with role sales_rep views any report,
**When** the data is returned,
**Then** only records where owner_id = their user ID are included — regardless of org-wide totals.

### AC-07: Manager sees all org data
**Given** a user with role manager or admin views any report,
**When** no owner filter is applied,
**Then** all records in the organisation are included.

### AC-08: Default date range is last 30 days
**Given** a user opens a report page with no filters applied,
**When** the report loads,
**Then** the default date range is the last 30 days (from today).

---

## 6. Out of Scope (MVP)

- Custom report builder (drag-and-drop report creation)
- Scheduled email reports (weekly digest)
- Revenue forecasting / weighted pipeline
- Funnel and conversion rate charts
- CSV export of report data
- Charts or visualisations (numbers only in MVP — no bar charts)

---

## 7. Data Requirements

### Entities involved (read-only aggregations)
- **Deal**: won_at, lost_at, value, stage_id, status, owner_id
- **Activity**: type, created_at, owner_id
- **Lead**: source, created_at, owner_id
- **PipelineStage**: name, display_order (for pipeline value grouping)
- **User**: name (for rep labels in activity report)

No new entities or fields are required for this module. All data is read from existing entities via aggregation queries.

### New fields (if any)

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| None | — | — | — | Reports are read-only; no schema changes needed |

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/reports/deals | Deals won/lost summary for date range | Yes |
| GET | /api/reports/pipeline-value | Open deal value by stage | Yes |
| GET | /api/reports/activities | Activity count by rep for date range | Yes |
| GET | /api/reports/leads-by-source | Lead count by source for date range | Yes |

All report endpoints are GET only (read-only). No POST, PUT, or DELETE.

**Common query parameters for all report endpoints**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| startDate | date (ISO8601) | No | 30 days ago | Start of date range |
| endDate | date (ISO8601) | No | Today | End of date range |
| ownerId | uuid | No | — | Filter by specific user (Manager/Admin only) |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Reports page (`/reports`) | 4 sections in a single scrollable page; shared date range picker at the top |
| Deals summary section | Won count, lost count, total won value for date range |
| Pipeline value section | Table of stages with total deal value and deal count per stage |
| Activity summary section | Table of reps with activity count per type for date range |
| Leads by source section | Table of sources with lead counts for date range |
| Date range picker (shared) | Start + end date; presets: last 7 days / 30 days / 90 days / this quarter |

---

## 10. Business Rules

- **BR-01**: All report data is always scoped by organization_id. No cross-tenant data is ever returned.
- **BR-02**: Sales Reps can only see their own data. The service layer enforces owner_id = caller's user ID for sales_rep role, regardless of any ownerId query parameter passed.
- **BR-03**: Report data is read-only — no mutations are possible via the reports module.
- **BR-04**: Date range defaults to last 30 days if no parameters are provided.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Sales Rep provides another user's ownerId | The ownerId is silently overridden to the caller's own ID |
| Invalid date format in startDate/endDate | 400 "Invalid date format. Use ISO8601 (YYYY-MM-DD)." |
| startDate is after endDate | 400 "startDate must be before or equal to endDate." |
| ownerId references a user outside the org | 404 "User not found." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View reports page | ✅ | ✅ | ✅ |
| View all-org data | ✅ | ✅ | ❌ |
| View own data | ✅ | ✅ | ✅ |
| Filter by any rep | ✅ | ✅ | ❌ (own only) |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec | `specs/ui/reports.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1reports` |
| DB spec | `specs/features/basic-reports/db-spec.md` |
| Test spec | `specs/features/basic-reports/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should the activity report show activities by type (call, email, meeting) as separate columns, or just a total count? | Product | — | Resolved: separate columns per type (call / email / meeting / demo / lunch / other) |
