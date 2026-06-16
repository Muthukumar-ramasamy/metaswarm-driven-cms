# UI Spec: Lead Management

Full page-level UI spec: `specs/ui/leads-inbox.md`

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Leads inbox | `/leads` | All roles |

---

## Key UI Behaviours

- List view (not Kanban) with status colour-coded badges
- Default filter: status = new or contacted; disqualified and converted hidden
- Sales Reps see own leads; Manager/Admin see all
- Lead detail opens as a right-side drawer (LeadDetailDrawer) — NOT full-page navigation
- Row actions: Convert to Deal, Disqualify, Edit (kebab)
- Convert to Deal modal: pipeline stage selector (required), inherits title/value
- "Already converted" leads show a link to the created deal in the detail drawer

---

## Components

| Component | File |
|-----------|------|
| LeadsPage | `frontend/src/features/leads/pages/LeadsPage.tsx` |
| LeadDetailDrawer | `frontend/src/features/leads/components/LeadDetailDrawer.tsx` |
| ConvertToDealModal | `frontend/src/features/leads/components/ConvertToDealModal.tsx` |
| LeadForm | `frontend/src/features/leads/components/LeadForm.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| Leads inbox UI | `specs/ui/leads-inbox.md` |
| Feature spec | `specs/features/lead-management/feature-spec.md` |
