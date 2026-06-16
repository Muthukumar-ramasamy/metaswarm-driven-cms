# Feature Spec: Activity & Task Tracking

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Activity & Task Tracking |
| Module | Module 6 |
| Priority | P0 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Sales is activity-based. Reps win deals by doing the right things at the right times. Activities record what happened (logged calls, emails, meetings); tasks record what needs to happen next. Both use a single `activities` table — the `done` flag distinguishes them. Together they give a complete history of every relationship and ensure nothing falls through the cracks.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Log a completed activity
**As a** Sales Rep,
**I want to** log a completed activity (call, email, meeting) against a deal, contact, company, or lead,
**So that** the interaction history is preserved and visible to the team.

### 4.2 Schedule a follow-up task
**As a** Sales Rep,
**I want to** create a future task with a due date linked to a record,
**So that** I am reminded to follow up and nothing falls through the cracks.

### 4.3 View my task list
**As a** Sales Rep,
**I want to** see all my open tasks grouped by urgency,
**So that** I know exactly what I need to do today.

### 4.4 Mark task as done
**As a** Sales Rep,
**I want to** mark a task as done (with an optional outcome note),
**So that** it is cleared from my task list.

### 4.5 View activity feed on a record
**As a** Sales Rep,
**I want to** see all activities linked to a deal, contact, company, or lead,
**So that** I have the full interaction history in one place before a call.

### 4.6 View team activity
**As a** Manager,
**I want to** see all activities logged by my team,
**So that** I can assess activity levels and identify who needs coaching.

---

## 5. Acceptance Criteria

### AC-01: Log past activity
**Given** a Sales Rep submits an activity with type, subject, a linked record, and done = true,
**When** the form is submitted,
**Then** the activity is created with done = true and done_at = submitted timestamp (or current time if not provided).

### AC-02: Schedule task
**Given** a Sales Rep submits an activity with a due_date and done = false (or no done flag),
**When** the form is submitted,
**Then** the activity is created with done = false and appears in the rep's task list.

### AC-03: Activity must link to at least one record
**Given** a Sales Rep submits an activity with no deal_id, contact_id, company_id, or lead_id,
**When** the form is submitted,
**Then** the system returns 400 with message "An activity must be linked to at least one record."

### AC-04: My task list — own tasks only
**Given** a logged-in Sales Rep,
**When** they view their task list,
**Then** they see only tasks where owner_id = their user ID and done = false, ordered by due_date ascending.

### AC-05: Overdue tasks flagged
**Given** a task has due_date in the past and done = false,
**When** it appears in the task list,
**Then** it is displayed in the "Overdue" group with a visual indicator.

### AC-06: Mark task done
**Given** a Sales Rep clicks "Mark done" on a task and optionally enters an outcome note,
**When** confirmed,
**Then** done = true, done_at = current timestamp, and the task no longer appears in the open task list.

### AC-07: Task list grouped by urgency
**Given** a logged-in Sales Rep views their task list,
**When** tasks are displayed,
**Then** they are grouped as: Overdue / Today / Tomorrow / This Week / Next Week / Later — in that order.

### AC-08: Activity feed on record
**Given** a deal, contact, company, or lead has linked activities,
**When** a user views that record's detail page,
**Then** all linked activities are shown in the Activities tab, ordered by created_at descending.

### AC-09: Manager sees all org tasks
**Given** a user with role manager or admin,
**When** they view activities/tasks with no owner filter,
**Then** they see all activities in the organisation.

---

## 6. Out of Scope (MVP)

- Calendar view for tasks
- Recurring tasks (daily, weekly)
- Email activities auto-logged from inbox sync
- Activity templates
- Push notifications for overdue tasks

---

## 7. Data Requirements

### Entities involved
- **Activity**: single entity for both logged activities (done=true) and scheduled tasks (done=false)
- **Deal**: optional FK — activity can be linked
- **Contact**: optional FK — activity can be linked
- **Company**: optional FK — activity can be linked
- **Lead**: optional FK — activity can be linked

### New fields (if any)

All fields from existing entity spec at `specs/database/entities/activity.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Activity | type | ENUM | Yes | call, email, meeting, demo, lunch, other |
| Activity | subject | VARCHAR(255) | Yes | |
| Activity | notes | TEXT | No | Outcome note when marking done |
| Activity | done | BOOLEAN | Yes | Default false |
| Activity | done_at | TIMESTAMPTZ | No | Set when done=true |
| Activity | due_date | DATE | No | Required for tasks (done=false) |
| Activity | owner_id | UUID | Yes | FK → users.id |
| Activity | deal_id | UUID | No | FK → deals.id, SET NULL on deal delete |
| Activity | contact_id | UUID | No | FK → contacts.id, SET NULL |
| Activity | company_id | UUID | No | FK → companies.id, SET NULL |
| Activity | lead_id | UUID | No | FK → leads.id, SET NULL |

DB-level CHECK: at least one of deal_id, contact_id, company_id, lead_id must be NOT NULL.

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/activities | List activities (paginated, filter by owner/type/done/record) | Yes |
| POST | /api/activities | Create activity or task | Yes |
| GET | /api/activities/:id | Get activity detail | Yes |
| PUT | /api/activities/:id | Update activity | Yes |
| DELETE | /api/activities/:id | Soft-delete activity | Yes |
| PUT | /api/activities/:id/done | Mark task as done | Yes |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| My Tasks page (`/tasks`) | Tasks grouped by urgency (Overdue/Today/Tomorrow/This Week/Next Week/Later) |
| Mark Done modal | Optional outcome note; confirm button |
| Activity form (drawer) | Type, subject, linked record (deal/contact/company/lead), due date (for tasks), done flag |
| Activity feed (inline component) | Used on deal detail, contact detail, company detail, lead detail pages |

---

## 10. Business Rules

- **BR-01**: An activity must be linked to at least one of: deal, contact, company, or lead. A DB-level CHECK constraint enforces this.
- **BR-02**: Once done = true, done_at cannot be changed. The done flag is irreversible.
- **BR-03**: Activity type must be one of the activity_type ENUM values: call, email, meeting, demo, lunch, other.
- **BR-04**: done = false (task) — due_date should be provided, but is not strictly required at DB level.
- **BR-05**: Activities are scoped by organization_id on every query.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create activity with no linked record | 400 "An activity must be linked to at least one record." |
| Mark already-done task as done again | 400 "This activity is already marked as done." |
| Invalid activity type | 400 "Invalid activity type. Must be one of: call, email, meeting, demo, lunch, other." |
| Activity ID not found in org | 404 "Activity not found." |
| Sales Rep edits activity they don't own | 403 "You do not have permission to edit this activity." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View all org activities | ✅ | ✅ | ❌ |
| View own activities | ✅ | ✅ | ✅ |
| View activity on record | ✅ | ✅ | ✅ |
| Create activity / task | ✅ | ✅ | ✅ |
| Edit own activity | ✅ | ✅ | ✅ |
| Edit any activity | ✅ | ✅ | ❌ |
| Mark own task done | ✅ | ✅ | ✅ |
| Delete activity | ✅ | ✅ | ✅ (own only) |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec (tasks) | `specs/ui/my-tasks.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1activities` |
| DB entity spec | `specs/database/entities/activity.md` |
| DB spec | `specs/features/activity-task-tracking/db-spec.md` |
| Test spec | `specs/features/activity-task-tracking/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | When a task is marked done, should the user be prompted to schedule a follow-up? | Product | — | Resolved: No — keep it simple; follow-up scheduling is a separate action |
