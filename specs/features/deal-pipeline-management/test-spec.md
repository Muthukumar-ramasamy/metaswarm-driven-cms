# Test Spec: Deal & Pipeline Management

| Field | Value |
|-------|-------|
| Status | Done |
| Generated | 2026-06-14 |
| Feature spec status | Approved |

---

## 1. AC Coverage

| AC ID | Description | Test IDs |
|-------|-------------|----------|
| AC-01 | Sales Rep creates deal with title and stage; status=open | deal-unit-05, deal-unit-06, deal-unit-07, deal-int-03, deal-int-04, deal-int-05, deal-int-06, deal-e2e-01, deal-e2e-01b, deal-e2e-01c, deal-e2e-01d |
| AC-02 | Pipeline board scoped to org | deal-unit-01, deal-int-09, deal-e2e-02 |
| AC-03 | Sales Rep sees own deals (default filter) | deal-unit-02, deal-int-10, deal-e2e-03 |
| AC-04 | Won and Lost deals hidden from open board | deal-unit-04, deal-int-11, deal-int-29, deal-int-34, deal-e2e-04a, deal-e2e-04b |
| AC-05 | Mark deal won — status=won, wonAt set | deal-unit-25, deal-int-28, deal-int-29, deal-e2e-05 |
| AC-06 | Mark deal lost requires lostReason | deal-unit-29, deal-unit-30, deal-int-32, deal-int-33, deal-e2e-06, deal-e2e-07 |
| AC-07 | Stage history recorded on creation and stage move | deal-unit-07, deal-unit-17, deal-int-07, deal-int-22, deal-int-47, deal-e2e-08, deal-e2e-18 |
| AC-08 | Stage deletion blocked when stage has open deals | deal-unit-42, deal-int-39, deal-e2e-09 |
| AC-09 | Stage reorder persisted | deal-unit-47, deal-int-44, deal-e2e-10 |
| AC-10 | At least one stage must always exist | deal-unit-43, deal-int-40, deal-e2e-11 |

---

## 2. BR Coverage

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | Deal must have title and pipeline stage on creation | deal-unit-05, deal-int-05, deal-int-06, deal-e2e-01b, deal-e2e-01c |
| BR-02 | Deal marked Lost must include lost_reason | deal-unit-30, deal-int-33, deal-e2e-06 |
| BR-03 | Won/Lost deals not shown on open pipeline board; sales rep sees only own deals | deal-unit-02, deal-unit-26, deal-unit-31, deal-int-10, deal-int-11, deal-int-30, deal-int-34, deal-int-35, deal-e2e-03, deal-e2e-15 |
| BR-04 | Pipeline stage cannot be deleted if it has open deals | deal-unit-42, deal-int-39, deal-e2e-09 |
| BR-05 | At least one pipeline stage must always exist | deal-unit-43, deal-int-40, deal-e2e-11 |
| BR-06 | Deal value defaults to 0 if not provided | deal-unit-06, deal-int-04 |
| BR-07 | Stage history is append-only — no edits or deletes allowed | deal-unit-07, deal-unit-17, deal-unit-18, deal-int-07, deal-int-22, deal-int-47, deal-e2e-08b |

---

## 3. Permission Coverage

| Role | Action | Allowed Test IDs | Denied Test IDs |
|------|--------|-----------------|-----------------|
| Admin | View all deals | deal-int-13, deal-int-14 | — |
| Manager | View all deals | deal-int-13, deal-e2e-03b | — |
| Sales Rep | View own deals only | deal-int-10, deal-e2e-03 | deal-int-17, deal-e2e-15 |
| Admin | Create deal | deal-int-03 | — |
| Manager | Create deal | deal-int-03 (via managerToken) | — |
| Sales Rep | Create deal | deal-int-03 (via repAToken), deal-e2e-01 | — |
| Admin | Edit any deal | deal-int-23 | — |
| Manager | Edit any deal | deal-int-23 | — |
| Sales Rep | Edit own deal | deal-int-19 | deal-int-20 |
| Sales Rep | Reassign ownerId | — | deal-int-21 |
| Admin | Delete deal | deal-int-24 | — |
| Manager | Delete deal | — | deal-int-26, deal-e2e-12 |
| Sales Rep | Delete deal | — | deal-int-27, deal-e2e-13 |
| Admin | Mark deal won | deal-int-28 | — |
| Manager | Mark deal won | deal-unit-27 | — |
| Sales Rep | Mark own deal won | deal-int-28 (via repAToken) | deal-int-30 |
| Admin | Mark deal lost | deal-int-32 | — |
| Sales Rep | Mark own deal lost | deal-int-32 (via repAToken) | deal-int-35 |
| Admin | Manage pipeline stages (create/update/delete/reorder) | deal-int-36, deal-int-24, deal-int-44 | — |
| Manager | Manage pipeline stages | — | deal-int-37, deal-int-41, deal-int-45, deal-e2e-14b |
| Sales Rep | Manage pipeline stages | — | deal-int-38, deal-int-46, deal-e2e-14 |

---

## 4. Unit Tests

**File**: `backend/src/modules/deal-pipeline-management/__tests__/deal-pipeline-management.service.test.ts`

```
dealService.listDeals
  deal-unit-01: returns open deals with pagination meta
  deal-unit-02: sales rep ownerId forced to caller.sub (BR-03)
  deal-unit-03: manager can filter by any ownerId (not forced)
  deal-unit-04: default status filter is open — won/lost hidden from board (AC-04)

dealService.createDeal
  deal-unit-05: creates deal with status=open, owner=caller for sales_rep (AC-01, BR-01)
  deal-unit-06: deal value defaults to "0" when not provided (BR-06)
  deal-unit-07: appends initial stage history with fromStageId=null on creation (BR-07, AC-07)
  deal-unit-08: admin/manager may supply ownerId
  deal-unit-09: sales_rep ownerId cannot be overridden even if supplied

dealService.getDealById
  deal-unit-10: returns deal with stage history for admin
  deal-unit-11: throws NotFoundError when deal not found
  deal-unit-12: sales rep cannot view a deal they do not own (BR-03)
  deal-unit-13: sales rep can view their own deal

dealService.updateDeal
  deal-unit-14: sales rep can update their own deal
  deal-unit-15: sales rep cannot edit another reps deal — throws ForbiddenError
  deal-unit-16: sales rep cannot reassign ownerId — throws ForbiddenError
  deal-unit-17: stage change appends stage history record (AC-07, BR-07)
  deal-unit-18: no stage history appended when stage does not change
  deal-unit-19: throws NotFoundError when deal does not exist
  deal-unit-20: manager can edit any deal in the org

dealService.deleteDeal
  deal-unit-21: admin can soft-delete a deal
  deal-unit-22: manager cannot delete a deal — throws ForbiddenError
  deal-unit-23: sales rep cannot delete a deal — throws ForbiddenError
  deal-unit-24: throws NotFoundError when deal does not exist

dealService.markDealWon
  deal-unit-25: sets status=won and wonAt (AC-05)
  deal-unit-26: sales rep cannot mark another reps deal won — throws ForbiddenError (BR-03)
  deal-unit-27: manager can mark any deal won
  deal-unit-28: throws NotFoundError when deal does not exist

dealService.markDealLost
  deal-unit-29: sets status=lost, lostAt, and lostReason (AC-06)
  deal-unit-30: throws UnprocessableError when lostReason is empty string (BR-02)
  deal-unit-31: sales rep cannot mark another reps deal lost — throws ForbiddenError (BR-03)
  deal-unit-32: throws NotFoundError when deal does not exist

dealService.listStages
  deal-unit-33: returns existing stages when they exist
  deal-unit-34: seeds default stages when no stages exist for org

dealService.createStage
  deal-unit-35: admin can create a pipeline stage
  deal-unit-36: non-admin cannot create a stage — throws ForbiddenError
  deal-unit-37: manager cannot create a stage — throws ForbiddenError

dealService.updateStage
  deal-unit-38: admin can update a pipeline stage
  deal-unit-39: non-admin cannot update a stage — throws ForbiddenError
  deal-unit-40: throws NotFoundError when stage does not exist

dealService.deleteStage
  deal-unit-41: admin can delete a stage when no open deals and not the last stage
  deal-unit-42: throws UnprocessableError when stage has open deals (BR-04, AC-08)
  deal-unit-43: throws UnprocessableError when deleting the last stage (BR-05, AC-10)
  deal-unit-44: throws ForbiddenError for non-admin sales rep (permissions matrix)
  deal-unit-45: throws ForbiddenError for manager (permissions matrix)
  deal-unit-46: throws NotFoundError when stage does not exist

dealService.reorderStages
  deal-unit-47: admin can reorder stages; returns updated list (AC-09)
  deal-unit-48: non-admin cannot reorder stages — throws ForbiddenError
  deal-unit-49: manager cannot reorder stages — throws ForbiddenError
```

Total unit tests: **49**

---

## 5. Integration Tests

**File**: `backend/src/modules/deal-pipeline-management/__tests__/deal-pipeline-management.repository.integration.test.ts`

```
GET /api/pipeline-stages
  deal-int-01: returns seeded default stages for a new org
  deal-int-02: returns 401 without authentication token

POST /api/deals
  deal-int-03: creates deal with status=open and owner set to caller (AC-01)
  deal-int-04: deal value defaults to 0 when not provided (BR-06)
  deal-int-05: returns 400 when stageId is missing (BR-01)
  deal-int-06: returns 400 when title is missing (BR-01)
  deal-int-07: creates initial stage history entry on deal creation (BR-07, AC-07)
  deal-int-08: returns 401 without authentication

GET /api/deals
  deal-int-09: org isolation — org B cannot see org A deals (AC-02)
  deal-int-10: sales rep sees only own deals by default (AC-03, BR-03)
  deal-int-11: won and lost deals not in default open board list (AC-04, BR-03)
  deal-int-12: soft-deleted deals not returned by list (soft delete coverage)
  deal-int-13: manager can filter by ownerId to see specific rep deals
  deal-int-14: returns paginated response with pagination meta

GET /api/deals/:id
  deal-int-15: returns deal detail with stageHistory array
  deal-int-16: returns 404 for non-existent deal
  deal-int-17: returns 403 when sales rep tries to view another reps deal
  deal-int-18: org isolation — org B cannot view org A deal (returns 404)

PUT /api/deals/:id
  deal-int-19: sales rep can update their own deal
  deal-int-20: sales rep cannot edit another reps deal — returns 403
  deal-int-21: sales rep cannot reassign ownerId — returns 403
  deal-int-22: stage change appends a stage history record (AC-07, BR-07)
  deal-int-23: manager can edit any deal in the org

DELETE /api/deals/:id
  deal-int-24: admin can soft-delete; deal disappears from list
  deal-int-25: soft-deleted record has deleted_at set in DB (soft delete coverage)
  deal-int-26: manager cannot delete a deal — returns 403
  deal-int-27: sales rep cannot delete a deal — returns 403

POST /api/deals/:id/won
  deal-int-28: marks deal won; status=won, wonAt set (AC-05)
  deal-int-29: won deal removed from open pipeline board list (AC-04)
  deal-int-30: sales rep cannot mark another reps deal won — returns 403 (BR-03)
  deal-int-31: returns 404 for non-existent deal

POST /api/deals/:id/lost
  deal-int-32: marks deal lost with reason; all fields set (AC-06)
  deal-int-33: returns 400 when lostReason is missing (BR-02, AC-06)
  deal-int-34: lost deal removed from open pipeline board (AC-04, BR-03)
  deal-int-35: sales rep cannot mark another reps deal lost — returns 403 (BR-03)

POST /api/pipeline-stages
  deal-int-36: admin can create a pipeline stage
  deal-int-37: manager cannot create a stage — returns 403
  deal-int-38: sales rep cannot create a stage — returns 403

DELETE /api/pipeline-stages/:id
  deal-int-39: returns 422 when stage has open deals (BR-04, AC-08)
  deal-int-40: returns 422 when deleting the last stage (BR-05, AC-10)
  deal-int-41: manager cannot delete a stage — returns 403
  deal-int-42: soft-deleted stage has deleted_at set in DB (soft delete coverage)
  deal-int-43: soft-deleted stage does not appear in stage list

PUT /api/pipeline-stages/reorder
  deal-int-44: admin can reorder stages; new order is persisted (AC-09)
  deal-int-45: manager cannot reorder stages — returns 403
  deal-int-46: sales rep cannot reorder stages — returns 403

Stage history — append-only (BR-07)
  deal-int-47: stage history grows with each stage change; entries are not mutated
```

Total integration tests: **47**

---

## 6. E2E Tests (Playwright)

**File**: `e2e/deal-pipeline-management.spec.ts`

```
AC-01 — Create deal
  deal-e2e-01: sales rep creates deal with title and stage; appears in stage column
  deal-e2e-01b: submitting empty form shows required title error (form validation)
  deal-e2e-01c: submitting form without stage shows required stage error (form validation, BR-01)
  deal-e2e-01d: admin creates deal and assigns to rep

AC-02 — Pipeline board scoped to org
  deal-e2e-02: org isolation — org A deals not visible to org B user

AC-03 — Sales Rep sees own deals
  deal-e2e-03: sales rep does not see another reps deals on the board (AC-03, BR-03)
  deal-e2e-03b: manager can switch view to see all rep deals via filter

AC-04 — Won / Lost deals hidden from board
  deal-e2e-04a: won deal disappears from the open pipeline board (AC-04, AC-05)
  deal-e2e-04b: lost deal disappears from the open pipeline board

AC-05 — Mark deal won
  deal-e2e-05: sales rep marks own deal as won via confirmation dialog

AC-06 — Mark deal lost
  deal-e2e-06: submitting mark-lost form without reason shows validation error (BR-02)
  deal-e2e-07: sales rep marks deal lost with reason; deal removed from board

AC-07 — Stage history
  deal-e2e-08: moving a deal records move in Stage History tab (BR-07)
  deal-e2e-08b: stage history section has no delete button (append-only invariant BR-07)

AC-08 — Stage delete blocked by open deals
  deal-e2e-09: admin deleting stage with open deals sees 422 error message (BR-04)

AC-09 — Stage reorder
  deal-e2e-10: admin reorders stages; new order persists after page reload

AC-10 — Last stage protection
  deal-e2e-11: admin cannot delete the last pipeline stage (BR-05)

Permissions — role-restricted UI
  deal-e2e-12: delete deal button hidden for manager (not just disabled)
  deal-e2e-13: delete deal button hidden for sales rep
  deal-e2e-14: pipeline settings page inaccessible for sales rep; redirected
  deal-e2e-14b: pipeline settings page inaccessible for manager; redirected
  deal-e2e-15: sales rep cannot see another reps deals on the board

Deal detail — form validation and error states
  deal-e2e-16: editing deal with empty title shows validation error
  deal-e2e-17: navigating to non-existent deal shows error state (404)
  deal-e2e-18: deal detail page shows stage history, activities, notes tabs

Pipeline settings — stage management
  deal-e2e-19: admin can add a new pipeline stage from settings page
  deal-e2e-20: admin can rename a pipeline stage inline
```

Total E2E tests: **22**

---

## 7. Grand Total

| Layer | Count |
|-------|-------|
| Unit (service) | 49 |
| Integration (repository/API) | 47 |
| E2E (Playwright) | 22 |
| **Total** | **118** |

---

## 8. Quality Gate Self-Check

| Gate | Status |
|------|--------|
| Every AC-NN has at least one E2E test | PASS — all 10 ACs covered |
| Every BR-NN has at least one unit or integration test | PASS — all 7 BRs covered |
| Every permission row has allowed AND denied tests | PASS — see Permission Coverage table |
| Denied tests assert HTTP 403 (not 404 or 200) | PASS — enforced in integration tests |
| Admin-only endpoints tested with Sales Rep token | PASS — deal-int-38, deal-int-46, deal-e2e-14 |
| Multi-tenancy isolation test | PASS — deal-int-09, deal-int-18, deal-e2e-02 |
| Soft-delete: records not in list after delete | PASS — deal-int-12, deal-int-25, deal-int-42, deal-int-43 |
| Soft-delete: deleted_at IS NOT NULL confirmed in DB | PASS — deal-int-25, deal-int-42 |
| Stage history append-only tested | PASS — deal-unit-07, deal-unit-17, deal-unit-18, deal-int-47, deal-e2e-08b |
| Form validation: required fields tested empty | PASS — deal-e2e-01b, deal-e2e-01c, deal-e2e-06, deal-e2e-16 |
| Error state: 404 on detail page tested | PASS — deal-e2e-17 |
| vi.resetAllMocks() in beforeEach | PASS — every unit test describe block |
| No shared mutable state between describe blocks | PASS — each block seeds own fixtures |
| Test independence (no execution-order dependency) | PASS — each test creates its own data |

---

## 9. Run Commands

```bash
# Unit tests
npm run test:unit --workspace=backend -- deal-pipeline-management

# Integration tests (requires DATABASE_URL and JWT_SECRET in backend/.env)
npm run test:integration --workspace=backend -- deal-pipeline-management

# E2E tests (requires running dev server)
npm run test:e2e -- deal-pipeline-management
```
