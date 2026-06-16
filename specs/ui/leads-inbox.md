# UI Spec: Leads Inbox

| Field | Value |
|-------|-------|
| Page name | Leads |
| Route | `/leads` |
| Feature | Lead Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Give sales reps a qualification queue — a list of incoming prospects they need to work through, update, and eventually convert to deals or disqualify.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Leads Inbox                           [+ New lead]         │
│  12 open leads                                               │
├──────────────────────────────────────────────────────────────┤
│  [Search leads...]  [Status ▼]  [Owner ▼]  [Source ▼]      │
├──────────────────────────────────────────────────────────────┤
│  Title ↕     Contact      Value ↕   Status ↕   Owner   Age ↕│
│  ──────────────────────────────────────────────────────────  │
│  SaaS deal   Alice Bo…    $5,000    New         Sam Lee  2d  │
│  Upgrade…    —            $12,000   Contacted   Sam Lee  5d  │
│  …                                                           │
├──────────────────────────────────────────────────────────────┤
│  ← 1  2 →                              Showing 1–20 of 24   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Leads Inbox" |
| Subtitle | "{n} open leads" (counts new + contacted only by default) |
| Primary action | "+ New lead" → opens CreateLeadDrawer |

---

## 3. Filter Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Search | text | Title, contact name | Empty |
| Status | select (multi) | New / Contacted / Qualified / Disqualified / Converted | New, Contacted |
| Owner | select | All / Me / {users} | All (manager); Me (rep) |
| Source | select | All / Manual / Web form / Import / Referral / Other | All |

Default view shows only status = "new" and "contacted" — matching the Leads Inbox concept. Users can expand to see all statuses.

---

## 4. Data Table

| Column | Source | Sortable | Width |
|--------|--------|----------|-------|
| Title | `title` | Yes | auto |
| Contact | `contactName` | Yes | 160px |
| Company | `companyName` | No | 140px |
| Value | `value` | Yes | 100px |
| Status | `status` | Yes | 110px |
| Owner | `ownerName` | Yes | 130px |
| Age | `createdAt` (relative) | Yes | 70px |
| Actions | — | No | 80px |

- **Title cell**: clickable → opens LeadDetailDrawer (side panel, not full page)
- **Value cell**: formatted as "$X,XXX" — "—" if 0
- **Status cell**: colour-coded badge
  - New → blue
  - Contacted → purple
  - Qualified → amber
  - Disqualified → grey
  - Converted → green
- **Age cell**: "2d", "1w", "3mo" relative time
- **Actions cell**: kebab menu:
  - Mark as Contacted
  - Mark as Qualified
  - Mark as Disqualified
  - Convert to Deal (opens ConvertLeadModal)
  - Edit
  - Delete (admin only)

**Empty state**: "Your inbox is clear. Create a lead to get started." + CTA.

---

## 5. Create Lead Drawer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | text | Yes | 1–255 chars |
| Value | currency input | No | ≥ 0, default 0 |
| Source | select | No | manual (default) |
| Contact | searchable select | No | Existing contacts in org |
| Company | searchable select | No | Existing companies in org |
| Expected close date | date picker | No | |
| Owner | select | No | Defaults to current user |

**On success**: Close drawer, prepend lead to list, toast "Lead created."

---

## 6. Convert Lead Modal

Triggered from row action "Convert to Deal." Opens a modal (not a drawer).

```
┌────────────────────────────────────────┐
│  Convert lead to deal                  │
│                                        │
│  Deal title _____________________ ←   │  (pre-filled from lead title)
│  Pipeline stage  [Lead In ▼]           │
│  Deal value  $________________         │  (pre-filled from lead value)
│  Expected close date ____________      │
│                                        │
│  [Cancel]          [Convert to deal]   │
└────────────────────────────────────────┘
```

**On success**: Close modal, row status badge changes to "Converted", toast "Lead converted. Deal created." with link to the new deal.

**On error (already converted)**: Toast "This lead has already been converted."

---

## 7. Lead Detail Drawer (side panel)

Opens from clicking the title row — replaces full-page detail for leads (leads are lighter-weight than deals).

```
┌──────────────────────────────────────┐
│  ← Back       [Edit]  [Convert]  [⋮] │
│                                      │
│  SaaS Expansion Deal                 │
│  $5,000 · New · Manual               │
│  Contact: Alice Brown                │
│  Company: Acme Corp                  │
│  Owner: Sam Lee                      │
│  Created: 2 days ago                 │
│                                      │
│  ── Activities ────────────────────  │
│  [+ Log activity]  [+ Schedule task] │
│  · Call · Alice · 2d ago             │
│                                      │
│  ── Notes ─────────────────────────  │
│  [+ Add note]                        │
│  "Met at conference..." — Sam, 2d    │
└──────────────────────────────────────┘
```

---

## 8. States

| State | UI |
|-------|----|
| Loading | Skeleton rows |
| Empty inbox | Inbox-empty illustration + CTA |
| Converting | Modal button spinner, background rows dimmed |
| Error | Error banner + retry |

---

## 9. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| See all leads | ✅ | ✅ | Own only |
| Owner filter | ✅ | ✅ | Hidden |
| "+ New lead" | ✅ | ✅ | ✅ |
| Quick status change | ✅ | ✅ | Own only |
| Convert to deal | ✅ | ✅ | Own only |
| Delete | ✅ | ❌ | ❌ |

---

## 10. Navigation

- **Active nav item**: "Leads"
- **Row click**: Opens LeadDetailDrawer (not navigation)

---

## 11. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/leads/pages/LeadsPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1leads` |
