# UI Spec: Pipeline Settings

| Field | Value |
|-------|-------|
| Page name | Pipeline Settings |
| Route | `/settings/pipeline` |
| Feature | Deal & Pipeline Management |
| Layout | AppLayout (sidebar + main) |
| Access | Admin only |

**Purpose**: Let an Admin customise the pipeline by adding, renaming, reordering, and deleting stages to match the team's actual sales process.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────┐
│  Settings › Pipeline                                 │
├──────────────────────────────────────────────────────┤
│  Sales Pipeline                                      │
│  Drag stages to reorder them.                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ⣿  Lead In          10%    3 deals   [Edit] [✕]│  │
│  │ ⣿  Contact Made     20%    4 deals   [Edit] [✕]│  │
│  │ ⣿  Demo Scheduled   40%    2 deals   [Edit]    │  │
│  │ ⣿  Proposal Sent    60%    3 deals   [Edit] [✕]│  │
│  │ ⣿  Negotiation      80%    2 deals   [Edit] [✕]│  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [+ Add stage]                                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 2. Stage List

Each stage row:

| Element | Detail |
|---------|--------|
| Drag handle (⣿) | Grab to reorder — fires PUT /api/pipeline-stages/reorder on drop |
| Stage name | Display name |
| Probability | "XX%" — the win probability for this stage |
| Deal count | "N deals" — open deals currently in stage |
| [Edit] button | Opens inline EditStageForm |
| [✕] button | Delete — hidden if stage has open deals (shown as disabled with tooltip) |

Minimum 1 stage must remain — last stage cannot be deleted.

---

## 3. Edit Stage Form (inline)

Clicking [Edit] expands an inline form below the stage row:

```
┌──────────────────────────────────────────────────────────┐
│ Name         [Contact Made_____________]                 │
│ Probability  [20] %                                      │
│                                           [Cancel] [Save]│
└──────────────────────────────────────────────────────────┘
```

| Field | Type | Validation |
|-------|------|------------|
| Name | text | 1–255 chars, unique within pipeline |
| Probability | number | 0–100 (integer) |

**On save**: Row updates in place. Toast "Stage updated."
**On duplicate name**: Inline error "A stage with this name already exists."

---

## 4. Add Stage

"+ Add stage" button appends a new inline form at the bottom of the list:

```
┌──────────────────────────────────────────────────────────┐
│ Name         [________________________]                  │
│ Probability  [0] %                                       │
│                                           [Cancel] [Add] │
└──────────────────────────────────────────────────────────┘
```

**On add**: New stage appears at the bottom. Toast "Stage added."

---

## 5. Delete Stage

- Clicking [✕] shows an inline confirmation:
  "Delete 'Contact Made'? This cannot be undone." → [Cancel] [Delete]
- If stage has open deals: [✕] is disabled, tooltip: "Move or close the 3 open deals in this stage first."

---

## 6. Drag to Reorder

- Drag handle allows vertical reordering within the list
- On drop: PUT /api/pipeline-stages/reorder fires with the new order of IDs
- Optimistic: visual order updates immediately; reverts on API error

---

## 7. States

| State | UI |
|-------|----|
| Loading | Skeleton rows |
| Saving order | Stage list shows a subtle loading overlay |
| Error | Toast "Failed to save order. Please try again." |
| Last stage | [✕] disabled on the last remaining stage |

---

## 8. Permissions

Admin only. Non-admins who navigate to `/settings/pipeline` are redirected to `/deals`.

---

## 9. Navigation

- **Active nav item**: "Settings" (sub-item: Pipeline)
- **Breadcrumb**: Settings › Pipeline

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/deals/pages/PipelineSettingsPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1pipeline-stages` |
