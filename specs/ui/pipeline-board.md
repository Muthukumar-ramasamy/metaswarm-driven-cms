# UI Spec: Pipeline Board

| Field | Value |
|-------|-------|
| Page name | Pipeline |
| Route | `/deals` |
| Feature | Deal & Pipeline Management |
| Layout | AppLayout (sidebar + main, full-width main) |

**Purpose**: Give sales reps and managers a visual Kanban board of all open deals grouped by pipeline stage — the primary daily-use screen in the CRM.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Pipeline                              [Owner ▼]  [+ New deal]              │
│  $87,500 open value · 14 deals                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Lead In (3)    Contact Made (4)   Demo Sched (2)  Proposal (3)  Nego (2)  │
│  $12,000         $28,500            $8,000          $24,000        $15,000   │
│  ─────────────  ────────────────   ─────────────   ────────────  ────────  │
│  ┌───────────┐  ┌───────────────┐                                           │
│  │ SaaS deal │  │ Beta upgrade  │  ...                                      │
│  │ Alice B.  │  │ Bob Chen      │                                           │
│  │ $5,000    │  │ $12,000       │                                           │
│  │ 5d ago    │  │ ● Task due    │                                           │
│  └───────────┘  └───────────────┘                                           │
│  [+ Add deal]   [+ Add deal]       ...                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Pipeline" |
| Subtitle | "${total open value} open · {n} deals" |
| Owner filter | Select — All / Me / {user list} (manager/admin only) |
| Primary action | "+ New deal" → opens CreateDealDrawer |

---

## 3. Kanban Board

### Stage column

| Element | Detail |
|---------|--------|
| Stage name | Bold, e.g. "Lead In" |
| Deal count | "(3)" next to name |
| Stage total value | Sum of open deal values in stage, below name |
| "+ Add deal" | Ghost button at bottom of column — opens CreateDealDrawer with stage pre-selected |
| Empty column | Shows "+ Add deal" with subtle dashed border |

Stage columns are horizontally scrollable if they overflow the viewport.

### Deal card

```
┌───────────────────────┐
│ Deal title            │
│ Contact Name          │
│ $5,000                │
│ ● Overdue task  5d ago│
│              [⋮]      │
└───────────────────────┘
```

| Card element | Detail |
|-------------|--------|
| Title | Max 2 lines, truncated with ellipsis |
| Contact name | Linked contact name |
| Value | Formatted "$X,XXX" — hidden if 0 |
| Overdue indicator | Red dot + "Overdue task" if a task is past due date |
| Age | Relative time since deal created |
| Kebab menu | Won, Lost, Edit, Delete (admin) |

**Card click** → navigate to `/deals/:id`

**Drag and drop**: Cards are draggable between stage columns. On drop: optimistic update of stage badge, PUT /api/deals/:id with new stageId. On error: card snaps back, toast "Failed to move deal."

---

## 4. Create Deal Drawer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | text | Yes | 1–255 chars |
| Contact | searchable select | Yes | Contacts in org |
| Stage | select | Yes | Pre-filled from column "+ Add deal" or first stage |
| Company | searchable select | No | |
| Value | currency input | No | ≥ 0 |
| Expected close date | date picker | No | |
| Owner | select | No | Defaults to current user |

**On success**: Close drawer, new deal card appears in correct column. Toast "Deal created."

---

## 5. Mark Won / Lost

### Won flow
- Triggered from card kebab → "Won"
- Confirmation: "Mark this deal as Won?" → [Cancel] [Mark Won]
- On confirm: card moves to a visual "Won" state and fades off the board. Toast "Deal won. 🎉"

### Lost flow
- Triggered from card kebab → "Lost"
- Opens a small inline modal:

```
┌────────────────────────────────┐
│  Why was this deal lost?       │
│                                │
│  Reason ____________________   │
│                                │
│  [Cancel]       [Mark lost]    │
└────────────────────────────────┘
```

- `lostReason` is required (cannot submit without it)
- On confirm: card fades off board. Toast "Deal marked as lost."

---

## 6. States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Page mount | Skeleton columns with skeleton cards |
| Empty board | No open deals | Centred: "No open deals. Create your first deal." + CTA |
| Dragging | User drags card | Card has elevated shadow, target column highlights |
| Drag error | API update fails | Card returns to original column. Toast error. |
| Winning deal | Kebab → Won | Confirmation dialog → card fades out |
| Losing deal | Kebab → Lost | Lost reason modal → card fades out |
| Error | API failure | Error banner at top of board |

---

## 7. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| See all deals | ✅ | ✅ | Own only |
| Owner filter | ✅ | ✅ | Hidden |
| Create deal | ✅ | ✅ | ✅ |
| Drag to move stage | ✅ | ✅ | Own only |
| Mark Won/Lost | ✅ | ✅ | Own only |
| Delete (kebab) | ✅ | ❌ | ❌ |

---

## 8. Navigation

- **Active nav item**: "Deals"
- **Card click**: `/deals/:id`
- **Default route**: `/` redirects here

---

## 9. Responsive Behaviour

| Breakpoint | Change |
|-----------|--------|
| > 1280px | All columns visible, horizontal scroll if > 5 stages |
| < 1280px | Horizontal scroll — stages do not collapse |
| < 768px | Single-column list view with stage badge on each card (no Kanban) |

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/deals/pages/PipelinePage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1deals` |
