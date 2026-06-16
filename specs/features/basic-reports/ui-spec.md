# UI Spec: Basic Reports

Full page-level UI spec: `specs/ui/reports.md`

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Reports | `/reports` | All roles |

---

## Key UI Behaviours

- Single scrollable page with 4 sections; shared date range picker at the top
- Date range picker: text inputs + presets (Last 7 days / Last 30 days / Last 90 days / This quarter)
- Default: last 30 days
- Sales Reps see own data only (ownerId silently set to self)
- Manager/Admin see all org data by default; can filter by rep via owner dropdown

### Sections
1. **Deals summary** — Won count + value / Lost count + value cards
2. **Pipeline value** — Table: stage name, deal count, total value; sorted by stage order
3. **Activity summary** — Table: rep name, count per type (call/email/meeting/demo/lunch/other), total
4. **Leads by source** — Table: source name, count

No charts in MVP — numbers only.

---

## Components

| Component | File |
|-----------|------|
| ReportsPage | `frontend/src/features/reports/pages/ReportsPage.tsx` |
| DateRangePicker | `frontend/src/features/reports/components/DateRangePicker.tsx` |
| DealsSummarySection | `frontend/src/features/reports/components/DealsSummarySection.tsx` |
| PipelineValueSection | `frontend/src/features/reports/components/PipelineValueSection.tsx` |
| ActivitySummarySection | `frontend/src/features/reports/components/ActivitySummarySection.tsx` |
| LeadsBySourceSection | `frontend/src/features/reports/components/LeadsBySourceSection.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| Reports UI | `specs/ui/reports.md` |
| Feature spec | `specs/features/basic-reports/feature-spec.md` |
