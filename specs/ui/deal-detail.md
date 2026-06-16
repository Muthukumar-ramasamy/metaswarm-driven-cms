# UI Spec: Deal Detail

| Field | Value |
|-------|-------|
| Page name | Deal Detail |
| Route | `/deals/:id` |
| Feature | Deal & Pipeline Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Give a rep or manager the complete context for a single deal — its current stage, linked contact, activity history, notes, and stage movement history — so they can prepare for a call or decide next steps.

---

## 1. Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Pipeline      SaaS Expansion Deal                  [Edit] [⋮]       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐│
│  │  DEAL INFO (left column)                │  │ STAGE SELECTOR       ││
│  │                                         │  │                      ││
│  │  Value         $5,000                   │  │ ● Lead In            ││
│  │  Contact       Alice Brown →            │  │ ○ Contact Made       ││
│  │  Company       Acme Corp →              │  │ ○ Demo Scheduled     ││
│  │  Owner         Sam Lee                  │  │ ○ Proposal Sent      ││
│  │  Close date    Jun 30, 2026             │  │ ○ Negotiation        ││
│  │  Created       Jun 13, 2026             │  │                      ││
│  │  Status        Open                     │  │ [Mark Won] [Mark Lost]││
│  └─────────────────────────────────────────┘  └──────────────────────┘│
│                                                                        │
├────────── TABS ─────────────────────────────────────────────────────── │
│  Activities (4)  │  Notes (2)  │  Stage History                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [+ Log activity]  [+ Schedule task]                                   │
│                                                                        │
│  ● Call · Alice Brown · Jun 12 · "Discussed pricing"         [⋮]     │
│  ✉ Email · Sam Lee · Jun 10 · "Sent proposal PDF"            [⋮]     │
│  ○ Task · Follow up call · Due Jun 15 · ⚠ Overdue            [Done]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deal Header

| Element | Detail |
|---------|--------|
| Back link | "← Pipeline" → `/deals` |
| Deal title | Large heading, inline-editable on click |
| Edit button | Opens EditDealDrawer |
| Kebab menu | Delete (admin), Change owner (manager/admin) |

---

## 3. Deal Info Panel (left)

| Field | Behaviour |
|-------|-----------|
| Value | Formatted "$X,XXX" — click to edit inline |
| Contact | Contact name as a link → `/contacts/:id` |
| Company | Company name as a link → `/companies/:id` (shown only if set) |
| Owner | User name — click to reassign (manager/admin only) |
| Close date | Date — click to edit with a date picker |
| Status | Badge: Open (blue) / Won (green) / Lost (red) |

---

## 4. Stage Selector (right panel)

- Vertical list of all pipeline stages
- Current stage has a filled dot; others have empty dots
- Clicking a stage moves the deal (PUT /api/deals/:id with new stageId) — no confirmation needed
- Below stages: [Mark Won] and [Mark Lost] buttons (same flow as pipeline board)

---

## 5. Tabs

### Activities tab

- Default tab
- Shows all activities (done and pending) for this deal, ordered by created_at desc
- Pending tasks shown at the top with due dates highlighted
- Overdue tasks flagged in red

**Activity item**:
- Icon by type (phone for call, envelope for email, etc.)
- Subject + contact name
- Date (relative if < 7 days, absolute otherwise)
- Done indicator (checkmark) vs pending (clock)
- Outcome text (if set) shown on expansion
- Kebab: Edit, Delete (admin/owner)

**Log Activity button**: opens LogActivityModal
**Schedule Task button**: opens ScheduleTaskModal

#### Log Activity Modal

```
┌────────────────────────────────────┐
│  Log activity                      │
│                                    │
│  Type     [Call ▼]                 │
│  Subject  __________________       │
│  Date     [Today ▼]  [Now ▼]       │
│  Duration ___  minutes             │
│  Outcome  ____________________     │
│                                    │
│  [Cancel]       [Log activity]     │
└────────────────────────────────────┘
```

#### Schedule Task Modal

```
┌────────────────────────────────────┐
│  Schedule task                     │
│                                    │
│  Type     [Call ▼]                 │
│  Subject  __________________       │
│  Due date [Date picker]            │
│  Due time [optional]               │
│  Note     ____________________     │
│                                    │
│  [Cancel]       [Schedule task]    │
└────────────────────────────────────┘
```

---

### Notes tab

- All notes for this deal, pinned notes at top
- Each note shows: author avatar + name, relative time, content (markdown rendered), pin icon
- "+ Add note" button at top → inline note form with textarea + [Save] [Cancel]
- Edit/delete only for note author or admin (kebab on hover)

---

### Stage History tab

| Column | Detail |
|--------|--------|
| From | Previous stage name (blank for initial) |
| To | New stage name |
| Moved by | User name |
| When | Relative time |

---

## 6. Edit Deal Drawer

| Field | Type | Required |
|-------|------|----------|
| Title | text | Yes |
| Value | currency | No |
| Contact | searchable select | Yes |
| Company | searchable select | No |
| Expected close date | date picker | No |
| Owner | select | No (manager/admin) |

---

## 7. States

| State | UI |
|-------|----|
| Loading | Skeleton for both panels, skeleton rows in activity tab |
| Not found | "Deal not found" full-page message + link back to /deals |
| Stage moving | Stage dot animates, optimistic update |
| Activity logging | Modal button spinner |
| Marking won | Confirmation dialog → status badge changes to Won, board redirects |
| Marking lost | Lost reason modal → status changes to Lost |

---

## 8. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | Own only |
| Edit deal | ✅ | ✅ | Own only |
| Move stage | ✅ | ✅ | Own only |
| Reassign owner | ✅ | ✅ | ❌ |
| Log/schedule activity | ✅ | ✅ | Own deal only |
| Delete deal | ✅ | ❌ | ❌ |
| Edit any note | ✅ | ❌ | ❌ |
| Delete any note | ✅ | ❌ | ❌ |

---

## 9. Navigation

- **Active nav item**: "Deals"
- **Back link**: `/deals`
- **Contact link**: `/contacts/:id` (opens in same tab)
- **Company link**: `/companies/:id` (opens in same tab)

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/deals/pages/DealDetailPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1deals~1{id}` |
