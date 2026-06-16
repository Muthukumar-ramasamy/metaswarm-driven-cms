# UI Spec: Deal & Pipeline Management

Full page-level UI specs:
- `specs/ui/pipeline-board.md`
- `specs/ui/deal-detail.md`
- `specs/ui/pipeline-settings.md`

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Pipeline board | `/deals` | All roles |
| Deal detail | `/deals/:id` | All roles |
| Pipeline settings | `/settings/pipeline` | Admin only |

---

## Key UI Behaviours

### Pipeline board
- Kanban layout — columns = stages ordered by display_order
- Sales Reps see only own deals; Manager/Admin see all
- Owner filter (Manager/Admin only) to view one rep's board
- Drag deal card between columns to change stage
- Won/Lost: click action on card opens confirmation / lost-reason modal
- Cards show: title, value, contact name, company name, overdue task indicator
- Won and Lost deals do not appear on the board

### Deal detail
- Left panel: stage selector (vertical list of stages); click to move
- Main area: deal info, inline edit fields
- Tabs: Activities, Notes, Stage History
- Stage History tab: append-only log of stage moves with user + timestamp
- Mark Won button; Mark Lost button (opens lost-reason modal)

### Pipeline settings
- Drag-to-reorder stage list
- Inline name and probability edit per stage
- "Add stage" button at bottom
- Delete button disabled (with tooltip) if stage has open deals
- Admin only — non-admins redirected

---

## Components

| Component | File |
|-----------|------|
| PipelineBoardPage | `frontend/src/features/deals/pages/PipelineBoardPage.tsx` |
| DealDetailPage | `frontend/src/features/deals/pages/DealDetailPage.tsx` |
| PipelineSettingsPage | `frontend/src/features/deals/pages/PipelineSettingsPage.tsx` |
| DealCard | `frontend/src/features/deals/components/DealCard.tsx` |
| DealForm | `frontend/src/features/deals/components/DealForm.tsx` |
| MarkLostModal | `frontend/src/features/deals/components/MarkLostModal.tsx` |
| StageHistory | `frontend/src/features/deals/components/StageHistory.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| Pipeline board UI | `specs/ui/pipeline-board.md` |
| Deal detail UI | `specs/ui/deal-detail.md` |
| Pipeline settings UI | `specs/ui/pipeline-settings.md` |
| Feature spec | `specs/features/deal-pipeline-management/feature-spec.md` |
