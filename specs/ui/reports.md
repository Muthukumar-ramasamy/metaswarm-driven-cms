# UI Spec: Reports

| Field | Value |
|-------|-------|
| Page name | Reports |
| Route | `/reports` |
| Feature | Basic Reports |
| Layout | AppLayout (sidebar + main) |
| Access | Manager and Admin only — Sales Rep sees own-data subset |

**Purpose**: Answer the four questions every sales leader asks every week: How many deals did we close? What's in the pipeline? Who is most active? Where are our leads coming from?

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Reports                                                     │
├──────────────────────────────────────────────────────────────┤
│  [Date range: Last 30 days ▼]  [Owner ▼]                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐                    │
│  │  Deals Won      │ │  Deals Lost     │                    │
│  │  12  $48,500    │ │  5   $18,000    │                    │
│  └─────────────────┘ └─────────────────┘                    │
│                                                              │
│  ── Pipeline Value by Stage ────────────────────────────    │
│  Lead In        ████████░░░░░░  $12,000  (3 deals)          │
│  Contact Made   ████████████░░  $28,500  (4 deals)          │
│  Demo Sched     ████░░░░░░░░░░  $8,000   (2 deals)          │
│  Proposal Sent  ████████████░░  $24,000  (3 deals)          │
│  Negotiation    ████████░░░░░░  $15,000  (2 deals)          │
│                                                              │
│  ── Activity Summary ──────────────────────────────────    │
│  Rep        Calls  Emails  Meetings  Total                   │
│  Sam Lee      8      12       3       23                     │
│  Alex Park    5       9       2       16                     │
│                                                              │
│  ── Leads by Source ───────────────────────────────────    │
│  Manual        ██████████  18  (60%)                        │
│  Web form      ████        6   (20%)                        │
│  Referral      ███         5   (17%)                        │
│  Import        █           1   (3%)                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Reports" |
| Date range picker | Preset options: Today / Last 7 days / Last 30 days / Last 90 days / This year / Custom |
| Owner filter | All / Me / {user list} (manager/admin) |

Date range applies to all report sections simultaneously.

---

## 3. Report Sections

### Section 1 — Deals Summary (stat cards)

Two stat cards side by side:

| Card | Metric |
|------|--------|
| Deals Won | Count + total value of won deals in period |
| Deals Lost | Count + total value of lost deals in period |

Below the cards: a table breakdown by owner (if "All" selected).

| Column | Detail |
|--------|--------|
| Rep | Owner name |
| Won | Count |
| Won value | $ |
| Lost | Count |
| Open | Count |

---

### Section 2 — Pipeline Value by Stage

Horizontal bar chart. Each bar represents one stage.

| Element | Detail |
|---------|--------|
| Stage name | Left label |
| Bar | Proportional to deal value, relative to largest stage |
| Value label | "$XX,XXX" to the right of bar |
| Deal count | "(N deals)" to the right of value |

No date filter — always shows current open pipeline snapshot.

---

### Section 3 — Activity Summary

Table of activity counts per rep for the selected date range.

| Column | Detail |
|--------|--------|
| Rep | Owner name |
| Calls | Count of type=call |
| Emails | Count of type=email |
| Meetings | Count of type=meeting |
| Demos | Count of type=demo |
| Other | Count of remaining types |
| Total | Sum |

Sorted by Total desc by default.

---

### Section 4 — Leads by Source

Horizontal bar chart. One bar per source.

| Element | Detail |
|---------|--------|
| Source | Label (Manual, Web form, Referral, etc.) |
| Bar | Proportional to count |
| Total | Count |
| Conversion rate | "XX% converted" label |

---

## 4. States

| State | UI |
|-------|----|
| Loading | Skeleton cards and bars |
| No data for period | "No data for this period." in each section |
| Error | Error banner per section with retry |
| Filtering | All sections reload simultaneously with shared spinner |

---

## 5. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| Owner filter | ✅ | ✅ | Hidden (always "Me") |
| See all-org data | ✅ | ✅ | ❌ (own data only) |
| Deals summary | ✅ | ✅ | Own deals only |
| Pipeline value | ✅ | ✅ | Own deals only |
| Activity summary | ✅ | ✅ | Own activities only |
| Leads by source | ✅ | ✅ | Own leads only |

---

## 6. Navigation

- **Active nav item**: "Reports"

---

## 7. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/reports/pages/ReportsPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1reports` |
