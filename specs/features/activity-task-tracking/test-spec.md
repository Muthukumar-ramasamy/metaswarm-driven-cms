# Test Spec: Activity & Task Tracking

| Field | Value |
|-------|-------|
| Status | Approved |
| Generated | 2026-06-14 |

---

## AC Coverage

| AC ID | Description | Test IDs |
|-------|-------------|----------|
| AC-01 | Log past activity (done=true, doneAt auto-set) | activity-unit-07, activity-unit-14, activity-int-03, activity-e2e-01, activity-e2e-01b |
| AC-02 | Schedule task (done=false, dueDate provided) | activity-unit-08, activity-int-04, activity-e2e-02, activity-e2e-07b |
| AC-03 | Activity must link to at least one record | activity-unit-09, activity-unit-10, activity-int-02, activity-e2e-03, activity-e2e-form-02 |
| AC-04 | My task list — own tasks only (sales rep scoped) | activity-unit-01, activity-int-09, activity-int-10, activity-e2e-04, activity-e2e-04b |
| AC-05 | Overdue tasks flagged with visual indicator | activity-int-09, activity-e2e-05, activity-e2e-05b |
| AC-06 | Mark task done — done=true, doneAt set, removed from open list | activity-unit-28, activity-unit-29, activity-int-21, activity-int-22, activity-int-23, activity-int-24, activity-e2e-06, activity-e2e-06b |
| AC-07 | Tasks grouped: Overdue / Today / Tomorrow / This Week / Next Week / Later | activity-e2e-07, activity-e2e-07b, activity-e2e-07c |
| AC-08 | Activity feed on record — all linked activities shown, ordered by created_at desc | activity-int-12, activity-int-31, activity-e2e-08, activity-e2e-08b |
| AC-09 | Manager / admin sees all org activities | activity-unit-02, activity-unit-03, activity-int-11, activity-e2e-09, activity-e2e-09b |

---

## BR Coverage

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | Activity must link to at least one of: deal, contact, company, or lead | activity-unit-09, activity-unit-10, activity-unit-13, activity-int-02, activity-e2e-03 |
| BR-02 | done is irreversible — once true, cannot be changed; second mark-done → 400 | activity-unit-30, activity-unit-31, activity-int-23, activity-e2e-06 |
| BR-03 | Activity type must be a valid ENUM value | activity-int-06, activity-e2e-form-02 |
| BR-04 | done=false (task) — dueDate is optional at DB level | activity-unit-08, activity-int-01, activity-int-04 |
| BR-05 | All activities scoped by organization_id; sales rep forced to own ownerId | activity-unit-01, activity-unit-02, activity-unit-03, activity-unit-11, activity-int-08, activity-int-09, activity-int-10, activity-int-17, activity-e2e-perm-01 |

---

## Permission Coverage

| Role | Action | Allowed | Denied |
|------|--------|---------|--------|
| Admin | View all org activities | activity-unit-03, activity-int-11, activity-e2e-09b | — |
| Admin | Create activity/task | activity-int-01, activity-int-03 | — |
| Admin | Edit any activity | activity-unit-21, activity-int-20 | — |
| Admin | Delete any activity | activity-unit-24, activity-int-26, activity-int-27 | — |
| Manager | View all org activities | activity-unit-02, activity-int-11, activity-e2e-09 | — |
| Manager | Edit any activity | activity-unit-21, activity-int-20 | — |
| Manager | Mark any task done | activity-unit-34, activity-int-25 (implicitly) | — |
| Sales Rep | View own activities only | activity-unit-01, activity-int-09, activity-e2e-04 | activity-unit-17, activity-int-15 (403 on other rep's) |
| Sales Rep | Create activity (own) | activity-unit-08, activity-int-01 | — |
| Sales Rep | Edit own activity | activity-unit-19, activity-int-18 | activity-unit-20, activity-int-19 (403 on other rep's) |
| Sales Rep | Edit another's activity | — | activity-unit-20, activity-int-19 |
| Sales Rep | Delete own activity | activity-unit-25, activity-int-28 | activity-unit-26, activity-int-29 (403 on other rep's) |
| Sales Rep | Mark own task done | activity-unit-28, activity-unit-29, activity-int-21, activity-int-22, activity-int-24 | activity-unit-32, activity-int-25 |

---

## Unit Tests

**File**: `backend/src/modules/activity-task-tracking/__tests__/activity-task-tracking.service.test.ts`

### activityService.listActivities

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-01 | Sales rep ownerId forced to caller.sub | BR-05, AC-04 |
| activity-unit-02 | Manager sees all org activities (no forced ownerId) | BR-05, AC-09 |
| activity-unit-03 | Admin can filter by any ownerId | BR-05, AC-09 |
| activity-unit-04 | done string "false" coerced to boolean false | AC-04 |
| activity-unit-05 | done string "true" coerced to boolean true | AC-01 |
| activity-unit-06 | Returns pagination meta alongside data | — |

### activityService.createActivity

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-07 | Creates logged activity with done=true; doneAt auto-set | AC-01 |
| activity-unit-08 | Creates task with done=false | AC-02, BR-04 |
| activity-unit-09 | Throws ValidationError when no linked record | AC-03, BR-01 |
| activity-unit-10 | ValidationError message is correct for no linked record | BR-01 |
| activity-unit-11 | Sales rep ownerId forced to caller.sub on create | BR-05 |
| activity-unit-12 | Admin can create activity on behalf of another user | BR-05 |
| activity-unit-13 | Activity linked to contactId only is accepted | BR-01 |
| activity-unit-14 | done=true with explicit doneAt uses provided doneAt | AC-01 |

### activityService.getActivityById

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-15 | Admin views any activity regardless of owner | BR-05 |
| activity-unit-16 | Sales rep views their own activity | BR-05 |
| activity-unit-17 | Sales rep viewing another rep's activity → ForbiddenError | BR-05 |
| activity-unit-18 | Non-existent activity → NotFoundError | — |

### activityService.updateActivity

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-19 | Owner can update subject and notes | — |
| activity-unit-20 | Sales rep cannot update another rep's activity → ForbiddenError | BR-05 |
| activity-unit-21 | Manager can update any activity in the org | BR-05 |
| activity-unit-22 | Non-existent activity on GET → NotFoundError | — |
| activity-unit-23 | repo.update returns undefined → NotFoundError | — |

### activityService.deleteActivity

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-24 | Admin can soft-delete any activity | — |
| activity-unit-25 | Sales rep can soft-delete their own activity | BR-05 |
| activity-unit-26 | Sales rep cannot delete another rep's activity → ForbiddenError | BR-05 |
| activity-unit-27 | Non-existent activity → NotFoundError | — |

### activityService.markActivityDone

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-unit-28 | Owner marks task done — done=true, doneAt set | AC-06 |
| activity-unit-29 | Marking done with outcome note passes notes to repo | AC-06 |
| activity-unit-30 | Already-done activity → ValidationError | BR-02 |
| activity-unit-31 | ValidationError message is correct for already-done | BR-02 |
| activity-unit-32 | Sales rep cannot mark another rep's task done → ForbiddenError | BR-05 |
| activity-unit-33 | Non-existent activity → NotFoundError | — |
| activity-unit-34 | Manager can mark done on any activity | BR-05 |
| activity-unit-35 | repo.markDone returns undefined → NotFoundError | — |

---

## Integration Tests

**File**: `backend/src/modules/activity-task-tracking/__tests__/activity-task-tracking.repository.test.ts`

### POST /api/activities

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-01 | Returns 201 and creates activity linked to a contact | AC-01 |
| activity-int-02 | Returns 400 when no linked record provided | AC-03, BR-01 |
| activity-int-03 | Creates logged activity with done=true and doneAt set | AC-01 |
| activity-int-04 | Creates a task with due_date | AC-02, BR-04 |
| activity-int-05 | Returns 401 without token | — |
| activity-int-06 | Returns 400 for invalid activity type | BR-03 |
| activity-int-07 | Returns 400 for missing subject | — |

### GET /api/activities

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-08 | Org isolation — org B cannot see org A activities | BR-05 |
| activity-int-09 | done=false filter returns only open tasks | AC-04 |
| activity-int-10 | Sales rep only sees own activities | AC-04, BR-05 |
| activity-int-11 | Manager sees all org activities | AC-09 |
| activity-int-12 | Filter by contactId returns only activities for that contact | AC-08 |
| activity-int-13 | Returns paginated result with pagination meta | — |

### GET /api/activities/:id

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-14 | Owner can fetch their own activity by id | — |
| activity-int-15 | Sales rep cannot view another rep's activity — 403 | BR-05 |
| activity-int-16 | Returns 404 for non-existent activity | — |
| activity-int-17 | Org B cannot view org A activity by id — 404/403 | BR-05 |

### PUT /api/activities/:id

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-18 | Owner can update their activity subject | — |
| activity-int-19 | Sales rep cannot update another rep's activity — 403 | BR-05 |
| activity-int-20 | Manager can update any activity in the org | BR-05 |

### PUT /api/activities/:id/done

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-21 | Marks task done — done=true, doneAt set | AC-06 |
| activity-int-22 | Marked-done task no longer appears in open task list | AC-06 |
| activity-int-23 | Returns 400 when marking already-done task done again | BR-02 |
| activity-int-24 | Outcome note is saved when marking done | AC-06 |
| activity-int-25 | Sales rep cannot mark another rep's task done — 403 | BR-05 |

### DELETE /api/activities/:id

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-26 | Soft delete — activity not returned in list | — |
| activity-int-27 | Soft delete — record still exists in DB with deleted_at set | — |
| activity-int-28 | Sales rep can soft-delete their own activity | BR-05 |
| activity-int-29 | Sales rep cannot delete another rep's activity — 403 | BR-05 |
| activity-int-30 | Returns 404 when deleting non-existent activity | — |

### Activity feed

| Test ID | Description | BRs / ACs |
|---------|-------------|-----------|
| activity-int-31 | GET with contactId returns only activities for that contact | AC-08 |

---

## E2E Tests

**File**: `e2e/activity-task-tracking.spec.ts`

| Test ID | Description | AC |
|---------|-------------|----|
| activity-e2e-01 | Sales rep logs a completed call; appears in activities list | AC-01 |
| activity-e2e-01b | Logged activity with done=true shows in completed activities tab | AC-01 |
| activity-e2e-02 | Sales rep creates a task with a future due date; appears in My Tasks | AC-02 |
| activity-e2e-03 | Submitting activity with no linked record shows validation error | AC-03 |
| activity-e2e-04 | Sales rep only sees their own open tasks on /tasks page | AC-04 |
| activity-e2e-04b | Tasks page shows open tasks ordered by due date ascending | AC-04 |
| activity-e2e-05 | Overdue task appears in "Overdue" group with visual indicator | AC-05 |
| activity-e2e-05b | Overdue task section exists when tasks past due date are present | AC-05 |
| activity-e2e-06 | Sales rep marks a task done; task disappears from open task list | AC-06 |
| activity-e2e-06b | Mark done modal accepts an optional outcome note | AC-06 |
| activity-e2e-07 | My Tasks page renders urgency group headings | AC-07 |
| activity-e2e-07b | Task with today's due date appears in "Today" group | AC-07 |
| activity-e2e-07c | Task with past due date appears in "Overdue" group | AC-07 |
| activity-e2e-08 | Activities linked to a contact appear in its Activities tab | AC-08 |
| activity-e2e-08b | Activity logged against a contact appears in that contact's feed | AC-08 |
| activity-e2e-09 | Manager can see activities created by sales reps | AC-09 |
| activity-e2e-09b | Admin sees all org activities with no owner filter | AC-09 |
| activity-e2e-form-01 | Empty subject shows required-field error | — |
| activity-e2e-form-02 | No type selected shows validation error | BR-03 |
| activity-e2e-form-03 | Invalid dueDate format is rejected by form | BR-04 |
| activity-e2e-error-01 | Non-existent activity URL shows error state | — |
| activity-e2e-error-02 | Task list API failure shows error state UI | — |
| activity-e2e-perm-01 | Sales rep does not see other reps' tasks on My Tasks page | BR-05 |
| activity-e2e-perm-02 | Sales rep cannot edit another rep's activity (hidden) | BR-05 |
| activity-e2e-perm-03 | Manager can view all org activities | AC-09 |

---

## Coverage Summary

| Metric | Count |
|--------|-------|
| ACs covered | 9/9 (100%) |
| BRs covered | 5/5 (100%) |
| Unit tests | 35 |
| Integration tests | 31 |
| E2E tests | 24 |
| Permission rows tested (allowed + denied) | 14 rows |

---

## Notes

- **AC-07 (task grouping by urgency)**: Grouping logic is a frontend concern (client-side bucketing of `due_date` values). The backend API supplies `due_date` and `done` fields. Integration test `activity-int-09` confirms the filter works. E2E tests `activity-e2e-07`, `activity-e2e-07b`, `activity-e2e-07c` verify the rendered groups.
- **AC-05 (overdue visual indicator)**: The integration test covers filter correctness. The E2E test is conditional on the E2E seed database containing a past-due task; a comment in the test documents this.
- **Soft delete**: `activity-int-27` verifies the DB-level record survives with `deleted_at IS NOT NULL` via a direct Drizzle query, satisfying the non-negotiable "no hard delete" invariant.
- **Org isolation**: `activity-int-08` and `activity-int-17` confirm cross-tenant access is blocked at both the list and single-record level.
