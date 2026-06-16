# Test Spec: Basic Reports

| Field | Value |
|-------|-------|
| Status | Done |
| Generated | 2026-06-14 |
| QA Agent | Yes |

---

## 1. AC Coverage

| AC ID | Description | Test IDs |
|-------|-------------|----------|
| AC-01 | Deals report filtered by date range (won_at / lost_at) | reports-unit-01, reports-unit-06, reports-unit-07, reports-unit-08, reports-unit-09, reports-int-02, reports-int-03, reports-e2e-03, reports-e2e-04, reports-e2e-05, reports-e2e-06 |
| AC-02 | Pipeline value scoped to org, open deals only | reports-unit-12, reports-unit-13, reports-int-06, reports-int-08, reports-e2e-07 |
| AC-03 | Pipeline value grouped by stage in display_order | reports-unit-12, reports-int-07, reports-e2e-07, reports-e2e-08 |
| AC-04 | Activity report by rep, filtered by date range | reports-unit-15, reports-unit-17, reports-int-09, reports-int-10, reports-e2e-09 |
| AC-05 | Leads by source, filtered by date range | reports-unit-19, reports-int-13, reports-int-14, reports-e2e-10 |
| AC-06 | Sales Rep sees own data only | reports-unit-03, reports-unit-04, reports-unit-16, reports-unit-20, reports-int-04, reports-int-11, reports-e2e-11, reports-e2e-12 |
| AC-07 | Manager sees all-org data | reports-unit-05, reports-int-12, reports-e2e-13, reports-e2e-14 |
| AC-08 | Default date range is last 30 days | reports-unit-06, reports-unit-17, reports-e2e-01, reports-e2e-02, reports-e2e-03 |

---

## 2. BR Coverage

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | All report data org-scoped (organizationId from JWT only) | reports-unit-02, reports-unit-13, reports-int-01, reports-int-08, reports-int-12, reports-int-15, reports-int-16 |
| BR-02 | Sales Rep ownerId silently overridden to caller.sub (no 403) | reports-unit-03, reports-unit-04, reports-unit-14, reports-unit-16, reports-unit-20, reports-int-04, reports-int-11, reports-e2e-12 |
| BR-03 | Reports are read-only (no mutations) | reports-unit-21, reports-e2e-15 |
| BR-04 | Default date range = last 30 days when no params supplied | reports-unit-06, reports-unit-17, reports-e2e-01 |

---

## 3. Permission Coverage

| Role | Action | Allowed | Denied |
|------|--------|---------|--------|
| Admin | View reports page | reports-e2e-08, reports-e2e-10, reports-e2e-14 | — |
| Manager | View all-org data | reports-unit-05, reports-e2e-13 | — |
| Manager | Filter by any rep | reports-unit-11, reports-e2e-13 | — |
| Sales Rep | View reports page (own data only) | reports-e2e-11 | — |
| Sales Rep | Pass another rep's ownerId | — (silently overridden, not 403) | reports-unit-03, reports-unit-04, reports-unit-14, reports-unit-16, reports-unit-20 |
| Sales Rep | See "filter by rep" selector | — | reports-e2e-12 |
| Unauthenticated | Access /reports | — | reports-e2e-16 |

---

## 4. Unit Tests

**File**: `backend/src/modules/basic-reports/__tests__/basic-reports.service.test.ts`

### basicReportsService.getDealsReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-unit-01 | Returns won/lost counts for valid date range | AC-01 |
| reports-unit-02 | organizationId always taken from JWT (not query) | BR-01 |
| reports-unit-03 | Sales rep ownerId silently overridden to caller.sub | BR-02, AC-06 |
| reports-unit-04 | Sales rep with no ownerId param still scoped to own sub | BR-02, AC-06 |
| reports-unit-05 | Manager with no ownerId sees all-org data (ownerId=undefined) | AC-07 |
| reports-unit-06 | Default date range covers ~30 days when no dates supplied | AC-08, BR-04 |
| reports-unit-07 | Invalid startDate format → ValidationError (400) | AC-01 |
| reports-unit-08 | Invalid endDate format → ValidationError (400) | AC-01 |
| reports-unit-09 | startDate after endDate → ValidationError with message | AC-01 |
| reports-unit-10 | Manager's ownerId not in org → NotFoundError (404) | error case |
| reports-unit-11 | Manager's valid ownerId passed to repo unchanged | AC-04, AC-07 |

### basicReportsService.getPipelineValueReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-unit-12 | Returns stages with grandTotal for manager | AC-02, AC-03 |
| reports-unit-13 | organizationId from JWT forwarded to repo | BR-01 |
| reports-unit-14 | Sales rep ownerId overridden on pipeline value | BR-02 |

### basicReportsService.getActivitiesReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-unit-15 | Returns per-type activity counts for specified rep | AC-04 |
| reports-unit-16 | Sales rep cannot see other rep's activities (override enforced) | BR-02, AC-06 |
| reports-unit-17 | Default date range applied when no dates provided | BR-04, AC-08 |
| reports-unit-18 | Invalid date format for activities → ValidationError | AC-04 |

### basicReportsService.getLeadsBySourceReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-unit-19 | Returns lead counts grouped by source | AC-05 |
| reports-unit-20 | Sales rep ownerId overridden to own sub for leads report | BR-02, AC-06 |

### Read-only enforcement

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-unit-21 | Service module exports only getter functions, no mutations | BR-03 |

---

## 5. Integration Tests

**File**: `backend/src/modules/basic-reports/__tests__/basic-reports.repository.test.ts`

### getDealsReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-int-01 | Org isolation: org A won deals invisible to org B | BR-01 |
| reports-int-02 | Won deal within date range counted; deal outside excluded | AC-01 |
| reports-int-03 | Lost deal within date range counted in lost totals | AC-01 |
| reports-int-04 | ownerId filter restricts results to single rep | AC-06 |
| reports-int-05 | Soft-deleted deals are not counted | soft-delete |

### getPipelineValueReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-int-06 | Only open deals included (won/lost excluded) | AC-02 |
| reports-int-07 | Stages ordered by display_order ascending | AC-03 |
| reports-int-08 | Org isolation on pipeline value | BR-01 |

### getActivitiesReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-int-09 | Activity counts per type per rep within date range | AC-04 |
| reports-int-10 | Activity outside date range excluded | AC-04, AC-08 |
| reports-int-11 | ownerId filter restricts activity report to single rep | AC-06 |
| reports-int-12 | Org isolation on activities report | BR-01 |

### getLeadsBySourceReport

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-int-13 | Leads grouped by source with correct counts | AC-05 |
| reports-int-14 | Lead outside date range excluded | AC-05, AC-08 |

### findUserInOrg

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| reports-int-15 | Returns user when userId exists in org | BR-01 |
| reports-int-16 | Returns undefined for cross-tenant user lookup | BR-01 |
| reports-int-17 | Returns undefined for soft-deleted user | soft-delete |

---

## 6. E2E Tests (Playwright)

**File**: `e2e/basic-reports.spec.ts`

### Default state

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-01 | Page loads with default 30-day date range pre-selected | AC-08 |
| reports-e2e-02 | All four report sections visible on load | AC-08 |

### Date range controls and presets

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-03 | "Last 7 days" preset updates date range | AC-01, AC-08 |
| reports-e2e-04 | "Last 30 days" preset loads deal report data | AC-01 |
| reports-e2e-05 | "Last 90 days" preset is visible and clickable | AC-01 |
| reports-e2e-06 | "This quarter" preset is visible and clickable | AC-01 |

### Pipeline value section

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-07 | Manager sees pipeline value table with stage rows | AC-02, AC-03 |
| reports-e2e-08 | Grand total label visible in pipeline value section | AC-03 |

### Activity report section

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-09 | Activity section shows per-type column headers | AC-04 |

### Leads by source section

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-10 | Leads by source section renders source rows | AC-05 |

### Sales Rep isolation

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-11 | Sales rep can access /reports (gets own data, not 403) | AC-06 |
| reports-e2e-12 | Sales rep does NOT see "filter by rep" selector | AC-06, BR-02 |

### Manager all-org access

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-13 | Manager sees "filter by rep" selector | AC-07 |
| reports-e2e-14 | Admin sees "filter by rep" selector | AC-07 |

### Read-only enforcement

| Test ID | Description | BRs |
|---------|-------------|-----|
| reports-e2e-15 | Reports page has no create/edit/delete buttons | BR-03 |

### Error states

| Test ID | Description | ACs |
|---------|-------------|-----|
| reports-e2e-16 | Unauthenticated user redirected to /login | security |

---

## 7. Coverage Summary

| Metric | Count |
|--------|-------|
| ACs covered | 8 / 8 |
| BRs covered | 4 / 4 |
| Permission rows tested (allowed + denied) | 7 |
| Unit tests | 21 |
| Integration tests | 17 |
| E2E tests | 16 |
| **Total tests** | **54** |

---

## 8. Gaps / Notes

- **BR-03 (read-only)**: The unit test (reports-unit-21) verifies no mutation functions are exported from the service module. No POST/PUT/DELETE routes exist per api-spec.md, so no HTTP-level mutation test is needed.
- **reports-int-04 (multi-tenancy for activities)**: Org isolation is verified via org-level seeding; cross-tenant user lookup also covered by reports-int-15/16.
- **E2E account prerequisite**: E2E tests assume `admin@test-crm.com`, `manager@test-crm.com`, and `salesrep@test-crm.com` are seeded in the test environment with appropriate data. A dedicated seed script or `globalSetup` in `playwright.config.ts` is recommended.
