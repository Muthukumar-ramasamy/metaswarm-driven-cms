# Feature Spec: Deal & Pipeline Management

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Deal & Pipeline Management |
| Module | Module 5 |
| Priority | P0 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

The pipeline is the heart of the CRM. It gives sales reps and managers a visual, stage-by-stage view of every open opportunity, its value, and its expected close date. Reps move deals through stages as progress is made, and ultimately mark them as Won or Lost. Managers see the full team's pipeline at a glance. Admins configure the stages to reflect the team's actual sales process.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Create deal
**As a** Sales Rep,
**I want to** create a deal in a pipeline stage,
**So that** I can start tracking a sales opportunity through the pipeline.

### 4.2 View pipeline board
**As a** Sales Rep,
**I want to** see all my open deals on a Kanban board grouped by stage,
**So that** I can see the shape of my pipeline at a glance.

### 4.3 Move deal to a different stage
**As a** Sales Rep,
**I want to** drag a deal card to a different stage,
**So that** the pipeline reflects the deal's current progress.

### 4.4 View deal detail
**As a** Sales Rep,
**I want to** open a deal and see its contact, company, value, activities, notes, and stage history,
**So that** I have full context before a customer interaction.

### 4.5 Edit deal
**As a** Sales Rep,
**I want to** update a deal's title, value, expected close date, or stage,
**So that** the pipeline is always accurate.

### 4.6 Mark deal as won
**As a** Sales Rep,
**I want to** mark a deal as Won,
**So that** it is recorded as closed revenue and removed from the open pipeline.

### 4.7 Mark deal as lost
**As a** Sales Rep,
**I want to** mark a deal as Lost with a reason,
**So that** the team can learn from the loss and the pipeline stays clean.

### 4.8 Filter pipeline by owner
**As a** Manager,
**I want to** filter the pipeline board to show one rep's deals,
**So that** I can coach a specific rep on their pipeline.

### 4.9 Manage pipeline stages
**As an** Admin,
**I want to** add, rename, reorder, and delete pipeline stages,
**So that** the pipeline reflects the team's actual sales process.

---

## 5. Acceptance Criteria

### AC-01: Create deal
**Given** a Sales Rep submits a deal with a title and a pipeline stage,
**When** the form is submitted,
**Then** the deal is created with status = "open", owner_id = submitting user, and placed in the selected stage.

### AC-02: Pipeline board scoped to org
**Given** a logged-in user,
**When** they view the pipeline board,
**Then** they see only deals belonging to their organisation.

### AC-03: Sales Rep sees own deals
**Given** a user with role sales_rep,
**When** they view the pipeline board with default filters,
**Then** they see only deals where owner_id = their user ID.

### AC-04: Won and Lost deals hidden from board
**Given** a deal has status = "won" or status = "lost",
**When** the pipeline board is viewed,
**Then** the deal does not appear on the board (only open deals are shown).

### AC-05: Mark deal won
**Given** a Sales Rep marks a deal as Won,
**When** confirmed,
**Then** deal status = "won", won_at = current timestamp, and the deal is removed from the open pipeline board.

### AC-06: Mark deal lost requires reason
**Given** a Sales Rep attempts to mark a deal as Lost,
**When** they submit the form without a lost reason,
**Then** the system returns 400 with message "Lost reason is required."

### AC-07: Stage history recorded on move
**Given** a deal is moved from Stage A to Stage B,
**When** the deal detail is opened,
**Then** the Stage History tab shows the move with: from-stage, to-stage, timestamp, and user who moved it.

### AC-08: Stage deletion blocked by open deals
**Given** a pipeline stage has at least one open deal,
**When** an Admin attempts to delete the stage,
**Then** the system returns 422 with message "Cannot delete a stage with open deals. Move or close them first."

### AC-09: Stage reorder persisted
**Given** an Admin reorders pipeline stages by dragging,
**When** the changes are saved,
**Then** the pipeline board and settings page reflect the new stage order.

### AC-10: At least one stage must exist
**Given** there is exactly one pipeline stage,
**When** an Admin attempts to delete it,
**Then** the system returns 422 with message "The pipeline must have at least one stage."

---

## 6. Out of Scope (MVP)

- Multiple pipelines
- Deal products / line items
- Deal probability override
- Deal rotation / round-robin assignment
- Revenue forecasting / weighted pipeline value
- Deal duplication

---

## 7. Data Requirements

### Entities involved
- **Deal**: primary entity; created, updated, moved between stages, marked won/lost
- **Pipeline**: single pipeline per org; stages belong to it
- **PipelineStage**: configurable stages; deals reference a stage_id
- **Contact**: optional link on deal
- **Company**: optional link on deal

### New fields (if any)

All fields from existing entity specs at `specs/database/entities/deal.md` and `specs/database/entities/pipeline-stage.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Deal | title | VARCHAR(255) | Yes | |
| Deal | value | DECIMAL(12,2) | No | Default 0 |
| Deal | status | ENUM | Yes | open, won, lost |
| Deal | stage_id | UUID | Yes | FK → pipeline_stages.id |
| Deal | owner_id | UUID | Yes | FK → users.id |
| Deal | contact_id | UUID | No | FK → contacts.id |
| Deal | company_id | UUID | No | FK → companies.id |
| Deal | expected_close_date | DATE | No | |
| Deal | won_at | TIMESTAMPTZ | No | Set when marked won |
| Deal | lost_at | TIMESTAMPTZ | No | Set when marked lost |
| Deal | lost_reason | TEXT | No | Required when status = lost |
| PipelineStage | name | VARCHAR(100) | Yes | Unique per pipeline |
| PipelineStage | display_order | INTEGER | Yes | Position in kanban |
| PipelineStage | probability | INTEGER | Yes | 0–100; default 0 |

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/deals | List deals (paginated, filter by status/owner/stage) | Yes |
| POST | /api/deals | Create deal | Yes |
| GET | /api/deals/:id | Get deal detail (with stage history, activities, notes) | Yes |
| PUT | /api/deals/:id | Update deal | Yes |
| DELETE | /api/deals/:id | Soft-delete deal | Yes — Admin only |
| POST | /api/deals/:id/won | Mark deal as won | Yes |
| POST | /api/deals/:id/lost | Mark deal as lost (requires lostReason) | Yes |
| GET | /api/pipeline-stages | List pipeline stages for org | Yes |
| POST | /api/pipeline-stages | Create pipeline stage | Yes — Admin |
| PUT | /api/pipeline-stages/:id | Update stage name/probability | Yes — Admin |
| DELETE | /api/pipeline-stages/:id | Delete stage (blocked if open deals) | Yes — Admin |
| PUT | /api/pipeline-stages/reorder | Reorder stages (array of {id, displayOrder}) | Yes — Admin |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Pipeline board page (`/deals`) | Kanban board grouped by stage; draggable deal cards; won/lost modals |
| Deal detail page (`/deals/:id`) | Vertical stage selector; deal info panel; Stage History tab; Activities/Notes tabs |
| Create deal form | Title, value, stage, contact (optional), company (optional), close date |
| Mark Won confirmation | Simple confirm dialog |
| Mark Lost modal | Lost reason text input (required) |
| Pipeline settings page (`/settings/pipeline`) | Drag-to-reorder stages; inline edit name/probability; add/delete stage |

---

## 10. Business Rules

- **BR-01**: A deal must have a title and a pipeline stage on creation.
- **BR-02**: A deal marked Lost must include a lost_reason. The field is required at the API and UI level.
- **BR-03**: Won and Lost deals are not shown on the open pipeline board. They are only visible in reports.
- **BR-04**: A pipeline stage cannot be deleted if it contains open deals.
- **BR-05**: There must always be at least one pipeline stage. Deleting the last stage is blocked.
- **BR-06**: Deal value defaults to 0 if not provided.
- **BR-07**: Stage history is append-only — past moves cannot be edited or deleted.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create deal without stage | 400 "Pipeline stage is required." |
| Mark deal lost without reason | 400 "Lost reason is required." |
| Delete stage with open deals | 422 "Cannot delete a stage with open deals." |
| Delete last remaining stage | 422 "The pipeline must have at least one stage." |
| Sales Rep edits deal they don't own | 403 "You do not have permission to edit this deal." |
| Deal ID not found in org | 404 "Deal not found." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View pipeline board (all) | ✅ | ✅ | ❌ (own only) |
| View pipeline board (own) | ✅ | ✅ | ✅ |
| View deal detail | ✅ | ✅ | ✅ (own only) |
| Create deal | ✅ | ✅ | ✅ |
| Edit own deal | ✅ | ✅ | ✅ |
| Edit any deal | ✅ | ✅ | ❌ |
| Move deal to stage | ✅ | ✅ | ✅ (own only) |
| Mark deal won | ✅ | ✅ | ✅ (own only) |
| Mark deal lost | ✅ | ✅ | ✅ (own only) |
| Delete deal | ✅ | ❌ | ❌ |
| Manage pipeline stages | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec (board) | `specs/ui/pipeline-board.md` |
| UI spec (deal detail) | `specs/ui/deal-detail.md` |
| UI spec (settings) | `specs/ui/pipeline-settings.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1deals` |
| DB entity spec (deal) | `specs/database/entities/deal.md` |
| DB entity spec (stage) | `specs/database/entities/pipeline-stage.md` |
| DB spec | `specs/features/deal-pipeline-management/db-spec.md` |
| Test spec | `specs/features/deal-pipeline-management/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should stage history record be created when a deal is first created (initial stage assignment)? | Product | — | Resolved: Yes — creation counts as the first stage entry with moved_from = null |
