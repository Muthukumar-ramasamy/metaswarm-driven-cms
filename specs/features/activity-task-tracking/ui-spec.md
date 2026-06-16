# UI Spec: Activity & Task Tracking

Full page-level UI spec: `specs/ui/my-tasks.md`

---

## Pages and Components

| Page / Component | Route | Access |
|-----------------|-------|--------|
| My Tasks page | `/tasks` | All roles |
| Activity feed (inline) | (embedded in detail pages) | All roles |
| Activity/task form (drawer) | (opened from any detail page or tasks page) | All roles |

---

## Key UI Behaviours

### My Tasks page
- Tasks grouped by urgency: Overdue / Today / Tomorrow / This Week / Next Week / Later
- Clicking "Mark done" opens MarkDoneModal (optional outcome note)
- No activities with `done=true` are shown (open tasks only)
- "+ New task" button opens activity form drawer
- Group headers show count

### Activity feed (inline on record pages)
- Shows all activities linked to the record (done=true and done=false)
- Ordered by created_at DESC
- Appears in Activities tab on deal-detail, contact-detail, company-detail, leads-inbox drawer

### Activity/task form
- Fields: type, subject, due_date, link to record (deal/contact/company/lead), done flag
- Logging a past activity: set done = true, optionally set done_at
- Scheduling a task: done = false, set due_date

---

## Components

| Component | File |
|-----------|------|
| MyTasksPage | `frontend/src/features/activities/pages/MyTasksPage.tsx` |
| ActivityFeed | `frontend/src/features/activities/components/ActivityFeed.tsx` |
| ActivityForm | `frontend/src/features/activities/components/ActivityForm.tsx` |
| MarkDoneModal | `frontend/src/features/activities/components/MarkDoneModal.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| My tasks UI | `specs/ui/my-tasks.md` |
| Feature spec | `specs/features/activity-task-tracking/feature-spec.md` |
