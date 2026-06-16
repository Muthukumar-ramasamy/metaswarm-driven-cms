# UI Spec: My Tasks

| Field | Value |
|-------|-------|
| Page name | My Tasks |
| Route | `/tasks` |
| Feature | Activity & Task Tracking |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Give sales reps a single place to see every task they need to complete, ordered by urgency, so nothing falls through the cracks.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  My Tasks                              [+ New task]         │
│  3 overdue · 5 due today                                     │
├──────────────────────────────────────────────────────────────┤
│  [Type ▼]  [Record ▼]   [Owner ▼ — manager only]            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠ OVERDUE  ──────────────────────────────────────────────  │
│  ○ Call · Alice Brown · Acme Corp     Was due Jun 11  [Done]│
│  ○ Email · SaaS deal → Proposal       Was due Jun 12  [Done]│
│                                                              │
│  TODAY  ────────────────────────────────────────────────── │
│  ○ Meeting · Bob Chen · Beta Inc      Due 2:00 PM    [Done] │
│  ○ Demo · Enterprise deal             Due 4:00 PM    [Done] │
│                                                              │
│  THIS WEEK  ──────────────────────────────────────────────  │
│  ○ Call · Carol Davis                 Due Jun 16     [Done] │
│                                                              │
│  LATER  ──────────────────────────────────────────────────  │
│  ○ Follow up · Dave Evans             Due Jun 25     [Done] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "My Tasks" (rep) or "Tasks" (manager/admin) |
| Subtitle | "{n} overdue · {n} due today" — colour-coded counts |
| Primary action | "+ New task" → opens ScheduleTaskDrawer |

---

## 3. Filter Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Type | select (multi) | All / Call / Email / Meeting / Demo / Lunch / Other | All |
| Record | select | All / Linked to Deal / Contact / Company / Lead | All |
| Owner | select | All / Me / {users} | Me (hidden for sales rep) |

---

## 4. Task Groups

Tasks are grouped by due date into sections. Sections without tasks are hidden.

| Group | Condition |
|-------|-----------|
| ⚠ Overdue | due_date < today |
| Today | due_date = today |
| Tomorrow | due_date = tomorrow |
| This week | due_date within current calendar week |
| Next week | due_date within next calendar week |
| Later | due_date beyond next week |

Each group shows its task count in the section header. The "Overdue" section header is red.

---

## 5. Task Row

```
○  [type icon]  Subject text                  Linked record   Due date/time   [Done]
```

| Element | Detail |
|---------|--------|
| Checkbox circle | Click → marks done (opens MarkDoneModal for optional outcome) |
| Type icon | Phone (call), envelope (email), calendar (meeting), etc. |
| Subject | Task subject, max 1 line |
| Linked record | "Deal: SaaS deal" or "Contact: Alice Brown" — clickable link |
| Due date/time | "2:00 PM" (today), "Jun 16" (future), "Was due Jun 11" in red (overdue) |
| [Done] button | Secondary button — same as clicking the checkbox |
| Row hover | Reveal kebab menu: Edit, Delete (admin) |

---

## 6. Mark Done Modal

Triggered by clicking [Done] or the checkbox.

```
┌────────────────────────────────────┐
│  Mark task as done                 │
│  "Call Alice Brown"                │
│                                    │
│  Outcome (optional)                │
│  ___________________________       │
│                                    │
│  [Skip]         [Mark done]        │
└────────────────────────────────────┘
```

- "Skip" → marks done with no outcome recorded
- "Mark done" → marks done with the entered outcome
- On success: task row fades out and moves to a collapsed "Completed" section at the bottom

---

## 7. Schedule Task Drawer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Type | select | Yes | call, email, meeting, demo, lunch, other |
| Subject | text | Yes | 1–255 chars |
| Due date | date picker | Yes | Cannot be in the past |
| Due time | time picker | No | |
| Note | textarea | No | |
| Link to | searchable select | Yes | At least one: deal, contact, company, or lead |
| Owner | select | No | Defaults to current user |

**On success**: Drawer closes, task appears in correct group. Toast "Task scheduled."

---

## 8. States

| State | UI |
|-------|----|
| Loading | Skeleton rows in each group |
| All done | Celebration empty state: "All caught up! No pending tasks." |
| Filtered empty | "No tasks match your filters." |
| Marking done | Row has a progress indicator, [Done] button disabled |
| Error | Error banner + retry |

---

## 9. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| See own tasks | ✅ | ✅ | ✅ |
| See all tasks | ✅ | ✅ | ❌ |
| Owner filter | ✅ | ✅ | Hidden |
| Create task | ✅ | ✅ | ✅ |
| Mark done (own) | ✅ | ✅ | ✅ |
| Mark done (any) | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |

---

## 10. Navigation

- **Active nav item**: "Tasks"
- **Linked record links**: Navigate to the linked deal/contact/company detail page

---

## 11. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/activities/pages/MyTasksPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1activities` |
