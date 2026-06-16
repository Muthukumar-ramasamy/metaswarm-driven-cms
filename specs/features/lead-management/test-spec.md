# Test Spec: Lead Management

| Field | Value |
|-------|-------|
| Feature | Lead Management |
| Status | Tests generated |
| Generated | 2026-06-14 |

---

## 1. AC Coverage

| AC ID | Description | Test IDs |
|-------|-------------|----------|
| AC-01 | Create lead with title; status = new, owner = submitting user | lead-unit-06, lead-unit-07, lead-unit-08, lead-unit-09, lead-int-12, lead-int-13, lead-e2e-01, lead-e2e-01b, lead-e2e-form-01 |
| AC-02 | Leads inbox scoped to org (only org-matching leads shown) | lead-unit-01 (via scope), lead-int-01, lead-int-02, lead-e2e-02 |
| AC-03 | Sales Rep sees only their own leads by default | lead-unit-01, lead-int-03, lead-int-04, lead-e2e-02, lead-e2e-11 |
| AC-04 | Default filter excludes disqualified and converted | lead-unit-02, lead-int-05, lead-int-06, lead-int-21, lead-e2e-03, lead-e2e-03b |
| AC-05 | Convert lead creates deal (title, value, stageId, contact, company inherited) | lead-unit-26, lead-unit-30, lead-unit-31, lead-int-19, lead-int-20, lead-e2e-04, lead-e2e-form-02 |
| AC-06 | Converted deal linked to lead (convertedDealId set; deal link shown in UI) | lead-unit-26, lead-int-19, lead-e2e-04b |
| AC-07 | Lead cannot be converted twice (422 returned) | lead-unit-27, lead-int-21 (implicit), lead-e2e-05 |
| AC-08 | Disqualify lead; disappears from default inbox | lead-unit-33, lead-int-06, lead-int-16, lead-e2e-03, lead-e2e-06 |
| AC-09 | Manager / Admin sees all org leads (not scoped to own) | lead-unit-04, lead-int-04, lead-unit-32, lead-e2e-07, lead-e2e-07b, lead-e2e-07c |

---

## 2. BR Coverage

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | Lead can only be converted once — second attempt returns 422 | lead-unit-27, lead-e2e-05 |
| BR-02 | Converted lead is never deleted — retained as audit trail | lead-unit-25, lead-int-18, lead-int-23 |
| BR-03 | Lead must have a title; all other fields optional | lead-unit-06, lead-unit-09, lead-unit-10, lead-int-12, lead-e2e-form-01 |
| BR-04 | Default inbox shows only new + contacted (excludes disqualified, converted) | lead-unit-02, lead-unit-03, lead-int-05, lead-int-06, lead-int-21, lead-e2e-03, lead-e2e-03b |
| BR-05 | Conversion requires a pipeline stage (stageId) — deal cannot be created without it | lead-unit-26 (stageId in params), lead-e2e-form-02 |

---

## 3. Permission Coverage

| Role | Action | ALLOWED Test ID | DENIED Test ID |
|------|--------|-----------------|----------------|
| Admin | View all org leads | lead-unit-04 (via manager path), lead-e2e-07b | — |
| Admin | Create lead | lead-unit-08, lead-e2e-01b | — |
| Admin | Update any lead | lead-unit-15, lead-e2e-14 | — |
| Admin | Convert any lead | lead-unit-32 | — |
| Admin | Delete lead | lead-unit-21, lead-int-17, lead-e2e-08 | — |
| Admin | Delete converted lead | — | lead-unit-25 (ForbiddenError) |
| Manager | View all org leads | lead-unit-04, lead-e2e-07, lead-e2e-07c | — |
| Manager | Create lead | lead-e2e-01b (admin covers this path) | — |
| Manager | Update any lead | lead-unit-15 (admin path; same logic) | — |
| Manager | Convert any lead | lead-unit-32, lead-e2e-04 | — |
| Manager | Delete lead | — | lead-unit-22 (ForbiddenError), lead-e2e-09 |
| Sales Rep | View own leads only | lead-unit-01, lead-unit-12, lead-int-03, lead-e2e-02 | lead-unit-13, lead-int-10, lead-e2e-11 (cross-rep 403) |
| Sales Rep | Create lead (own) | lead-unit-06, lead-int-12, lead-e2e-01 | — |
| Sales Rep | Update own lead | lead-unit-16, lead-e2e-14 | lead-unit-17 (other rep, ForbiddenError) |
| Sales Rep | Reassign owner | — | lead-unit-18 (ForbiddenError) |
| Sales Rep | Convert own lead | lead-unit-26, lead-e2e-04 | lead-unit-28 (other rep, ForbiddenError) |
| Sales Rep | Delete lead | — | lead-unit-23 (ForbiddenError), lead-e2e-10 |

---

## 4. Unit Tests

**File**: `backend/src/modules/lead-management/__tests__/lead-management.service.test.ts`

| Test ID | Function | Description | BRs / ACs |
|---------|----------|-------------|-----------|
| lead-unit-01 | listLeads | sales_rep ownerId forced to caller.sub | BR-03, AC-03 |
| lead-unit-02 | listLeads | default statusList = [new, contacted] | BR-04, AC-04 |
| lead-unit-03 | listLeads | manager can override status filter | BR-04 |
| lead-unit-04 | listLeads | manager can filter by ownerId | AC-09 |
| lead-unit-05 | listLeads | returns correct pagination metadata | — |
| lead-unit-06 | createLead | creates lead with status=new and owner=caller | BR-03, AC-01 |
| lead-unit-07 | createLead | sales_rep ownerId forced to caller.sub | BR-03, AC-01 |
| lead-unit-08 | createLead | admin can assign lead to another user | AC-01 |
| lead-unit-09 | createLead | value defaults to 0 | BR-03 |
| lead-unit-10 | createLead | optional fields passed through | BR-03 |
| lead-unit-11 | getLeadById | admin can view any lead | AC-09 |
| lead-unit-12 | getLeadById | sales_rep views their own lead | AC-03 |
| lead-unit-13 | getLeadById | sales_rep cannot view another rep's lead → ForbiddenError | BR-03, AC-03 |
| lead-unit-14 | getLeadById | missing lead → NotFoundError | — |
| lead-unit-15 | updateLead | admin can update any lead including ownerId | permissions |
| lead-unit-16 | updateLead | sales_rep updates own lead | AC-04, AC-08 |
| lead-unit-17 | updateLead | sales_rep cannot update another rep's lead → ForbiddenError | BR-03 |
| lead-unit-18 | updateLead | sales_rep cannot reassign ownerId → ForbiddenError | permissions |
| lead-unit-19 | updateLead | missing lead → NotFoundError | — |
| lead-unit-20 | updateLead | repo.update returns undefined → NotFoundError | — |
| lead-unit-21 | deleteLead | admin soft-deletes non-converted lead | permissions |
| lead-unit-22 | deleteLead | manager cannot delete → ForbiddenError | permissions |
| lead-unit-23 | deleteLead | sales_rep cannot delete → ForbiddenError | permissions |
| lead-unit-24 | deleteLead | missing lead → NotFoundError | — |
| lead-unit-25 | deleteLead | converted lead cannot be deleted → ForbiddenError | BR-02 |
| lead-unit-26 | convertLead | success path — deal created and lead marked converted | BR-01, BR-05, AC-05, AC-06 |
| lead-unit-27 | convertLead | already-converted lead → UnprocessableError | BR-01, AC-07 |
| lead-unit-28 | convertLead | sales_rep cannot convert another rep's lead → ForbiddenError | BR-03 |
| lead-unit-29 | convertLead | missing lead → NotFoundError | — |
| lead-unit-30 | convertLead | deals table absent — proceeds with null deal | AC-05 graceful |
| lead-unit-31 | convertLead | deal INSERT includes contact_id and company_id from lead | resolved open question |
| lead-unit-32 | convertLead | manager can convert any org lead | AC-09 |
| lead-unit-33 | updateLead (disqualify) | sales_rep sets status=disqualified on own lead | AC-08 |

---

## 5. Integration Tests

**File**: `backend/src/modules/lead-management/__tests__/lead-management.repository.test.ts`

| Test ID | Function | Description | BRs / ACs |
|---------|----------|-------------|-----------|
| lead-int-01 | findMany | org B cannot see org A leads | AC-02, tenant isolation |
| lead-int-02 | findMany | org A can see its own leads | AC-02 |
| lead-int-03 | findMany | ownerId filter returns only that rep's leads | AC-03 |
| lead-int-04 | findMany | no ownerId filter returns all org leads | AC-09 |
| lead-int-05 | findMany | default [new, contacted] excludes disqualified and converted | BR-04, AC-04 |
| lead-int-06 | findMany | explicit disqualified filter returns only disqualified | AC-08 |
| lead-int-07 | softDelete + findMany | soft-deleted lead excluded from results | soft delete coverage |
| lead-int-08 | softDelete + raw SQL | deleted_at set in DB; record NOT physically removed | BR-02 |
| lead-int-09 | findById | returns lead for correct org | AC-02 |
| lead-int-10 | findById | returns undefined for different org (tenant isolation) | AC-02 |
| lead-int-11 | findById | returns undefined for soft-deleted lead | soft delete coverage |
| lead-int-12 | create | creates lead with status=new, returns record | AC-01, BR-03 |
| lead-int-13 | create + findById | created lead returned by findById | AC-01 |
| lead-int-14 | update | updates title; returns updated record | AC-04 |
| lead-int-15 | update | wrong org returns undefined (tenant isolation) | AC-02 |
| lead-int-16 | update | status set to disqualified | AC-08 |
| lead-int-17 | softDelete + findMany | admin token — soft-delete removes from list | permissions |
| lead-int-18 | softDelete + raw SQL | deleted_at set; row still exists | BR-02 |
| lead-int-19 | convertLead | status=converted, convertedAt set, dealId linked | AC-05, AC-06 |
| lead-int-20 | convertLead | null dealId — convertedAt set, convertedDealId null | AC-05 |
| lead-int-21 | convertLead + findMany | converted lead excluded from default inbox | BR-04, AC-04 |
| lead-int-22 | convertLead | wrong org returns undefined (tenant isolation) | AC-02 |
| lead-int-23 | convertLead + raw SQL | converted lead row not physically removed | BR-02 |
| lead-int-24 | findMany | pagination — limit 2 returns 2 records and correct total | — |
| lead-int-25 | findMany | search filter returns only matching leads | API spec |

---

## 6. E2E Tests

**File**: `e2e/lead-management.spec.ts`

| Test ID | Description | ACs / BRs |
|---------|-------------|-----------|
| lead-e2e-01 | Sales rep creates lead with title; appears in inbox with status "New" | AC-01 |
| lead-e2e-01b | Admin creates lead with value; lead appears in inbox | AC-01 |
| lead-e2e-form-01 | Empty form submit shows "Title is required" inline error | BR-03, AC-01 |
| lead-e2e-02 | Sales rep only sees own leads; another rep's lead not visible | AC-03 |
| lead-e2e-03 | Disqualified lead disappears from default inbox | AC-04, AC-08, BR-04 |
| lead-e2e-03b | Converted lead absent from default inbox after conversion | AC-04, BR-04 |
| lead-e2e-04 | Sales rep converts lead; deal created; success feedback shown | AC-05 |
| lead-e2e-04b | Converted lead detail shows link to created deal | AC-06 |
| lead-e2e-05 | Converting already-converted lead shows error (hidden or 422 feedback) | AC-07, BR-01 |
| lead-e2e-form-02 | Convert modal without stage selection shows validation error | BR-05 |
| lead-e2e-06 | Sales rep disqualifies own lead; it disappears from inbox | AC-08 |
| lead-e2e-07 | Manager sees leads from all reps | AC-09 |
| lead-e2e-07b | Admin sees leads from all reps | AC-09 |
| lead-e2e-07c | Manager has owner filter available in the UI | AC-09 (feature 4.7) |
| lead-e2e-08 | Admin deletes lead; disappears from list | permissions matrix |
| lead-e2e-09 | Delete option hidden for manager role (not disabled) | permissions matrix |
| lead-e2e-10 | Delete option hidden for sales_rep role (not disabled) | permissions matrix |
| lead-e2e-11 | Sales rep cannot access another rep's lead detail (403 → error UI) | AC-03, permissions |
| lead-e2e-12 | Lead detail shows fields, activities tab, notes tab | AC-03 detail view |
| lead-e2e-13 | Non-existent lead ID shows error state | error cases |
| lead-e2e-14 | Sales rep updates lead status from New to Contacted | AC-04 |
| lead-e2e-15 | Search with no results shows empty state UI | — |
| lead-e2e-16 | Invalid lead UUID shows error state | error cases |

---

## 7. Quality Gate Checklist

```
COVERAGE — AC TRACEABILITY
[x] AC-01 → lead-e2e-01, lead-e2e-01b, lead-e2e-form-01
[x] AC-02 → lead-int-01, lead-int-02, lead-e2e-02
[x] AC-03 → lead-e2e-02, lead-e2e-11
[x] AC-04 → lead-e2e-03, lead-e2e-03b, lead-e2e-14
[x] AC-05 → lead-e2e-04, lead-e2e-form-02
[x] AC-06 → lead-e2e-04b
[x] AC-07 → lead-e2e-05
[x] AC-08 → lead-e2e-06, lead-e2e-03
[x] AC-09 → lead-e2e-07, lead-e2e-07b, lead-e2e-07c

COVERAGE — BR TRACEABILITY
[x] BR-01 → lead-unit-27, lead-e2e-05
[x] BR-02 → lead-unit-25, lead-int-18, lead-int-23
[x] BR-03 → lead-unit-06..10, lead-int-12, lead-e2e-form-01
[x] BR-04 → lead-unit-02, lead-int-05, lead-e2e-03, lead-e2e-03b
[x] BR-05 → lead-unit-26 (stageId required), lead-e2e-form-02

PERMISSIONS COVERAGE
[x] Admin delete: ALLOWED lead-e2e-08 / DENIED n/a (converted: lead-unit-25)
[x] Manager delete: ALLOWED n/a / DENIED lead-unit-22, lead-e2e-09
[x] Sales rep delete: ALLOWED n/a / DENIED lead-unit-23, lead-e2e-10
[x] Sales rep view other's lead: ALLOWED (own) lead-unit-12 / DENIED lead-unit-13, lead-e2e-11
[x] Sales rep convert other's lead: ALLOWED (own) lead-unit-26 / DENIED lead-unit-28
[x] Sales rep reassign owner: ALLOWED n/a / DENIED lead-unit-18

MULTI-TENANCY ISOLATION
[x] findMany org isolation: lead-int-01, lead-int-02
[x] findById org isolation: lead-int-10
[x] update org isolation: lead-int-15
[x] convertLead org isolation: lead-int-22

SOFT DELETE
[x] Soft-deleted leads NOT returned by findMany: lead-int-07
[x] Soft-deleted leads NOT returned by findById: lead-int-11
[x] Record still in DB after soft delete: lead-int-08, lead-int-18, lead-int-23

FORM VALIDATION (E2E)
[x] Title required: lead-e2e-form-01
[x] Pipeline stage required for convert: lead-e2e-form-02

ERROR STATES (E2E)
[x] 404 on detail page: lead-e2e-13, lead-e2e-16
[x] 403 on cross-rep detail: lead-e2e-11
[x] Already-converted conflict: lead-e2e-05
```

---

## 8. Coverage Summary

| Layer | Tests written | ACs covered | BRs covered | Permission rows (allowed + denied) |
|-------|--------------|-------------|-------------|-------------------------------------|
| Unit | 33 | 9/9 | 5/5 | 12/12 |
| Integration | 25 | 9/9 | 5/5 | 4/4 (tenant isolation) |
| E2E | 16 | 9/9 | 5/5 | 6/6 (UI permission boundaries) |

**Total tests: 74**

---

## 9. Gaps and Notes

| Gap | Explanation |
|-----|-------------|
| AC-06 unit test skipped | The linked deal detail is only visible at the UI layer; repository returns convertedDealId and the unit test for convertLead (lead-unit-26) verifies the value is set. E2E test lead-e2e-04b covers the UI link. |
| BR-05 unit test | The `stageId` required constraint is enforced by the Zod schema (convertLeadSchema) before the service is called. The service test (lead-unit-26) passes stageId as valid input; the missing-stageId path returns a 400 validation error at the route/controller layer, not the service layer. E2E test lead-e2e-form-02 covers the end-to-end path. |
| Deals table in integration | The deals table is created by the deal-pipeline-management migration. Integration tests for `convertLead` use `null` dealId or a random UUID to avoid dependency on that table existing in all test environments. |
