# DB Spec: Deal & Pipeline Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full entity specs: `specs/database/entities/deal.md`, `specs/database/entities/pipeline.md`, `specs/database/entities/pipeline-stage.md`

---

## Entities

### Deal → `deals`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| title | VARCHAR(255) | Yes | |
| value | DECIMAL(12,2) | No | Default 0 |
| status | ENUM | Yes | open, won, lost |
| stage_id | UUID | Yes | FK → pipeline_stages.id |
| owner_id | UUID | Yes | FK → users.id |
| contact_id | UUID | No | FK → contacts.id, SET NULL |
| company_id | UUID | No | FK → companies.id, SET NULL |
| lead_id | UUID | No | FK → leads.id, SET NULL |
| expected_close_date | DATE | No | |
| won_at | TIMESTAMPTZ | No | |
| lost_at | TIMESTAMPTZ | No | |
| lost_reason | TEXT | No | Required when status = lost (CHECK constraint) |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

DB CHECK: `lost_reason IS NOT NULL WHEN status = 'lost'`

### Pipeline → `pipelines`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| name | VARCHAR(255) | Yes | Default "Sales Pipeline" |
| is_default | BOOLEAN | Yes | Partial unique: one default per org |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |

### PipelineStage → `pipeline_stages`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| pipeline_id | UUID | Yes | FK → pipelines.id |
| organization_id | UUID | Yes | FK → organizations.id |
| name | VARCHAR(100) | Yes | Unique per pipeline |
| display_order | INTEGER | Yes | |
| probability | INTEGER | Yes | 0–100 (CHECK constraint) |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

### DealStageHistory (for stage audit trail)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| deal_id | UUID | Yes | FK → deals.id |
| organization_id | UUID | Yes | |
| from_stage_id | UUID | No | NULL for initial placement |
| to_stage_id | UUID | Yes | FK → pipeline_stages.id |
| moved_by | UUID | Yes | FK → users.id |
| moved_at | TIMESTAMPTZ | Yes | DEFAULT NOW() |

DealStageHistory is append-only — no UPDATE or DELETE ever.

---

## Relationships

| From | To | FK | On Delete |
|------|----|----|-----------|
| Deal | Organization | organization_id | CASCADE |
| Deal | User (owner) | owner_id | RESTRICT |
| Deal | PipelineStage | stage_id | RESTRICT |
| Deal | Contact | contact_id | SET NULL |
| Deal | Company | company_id | SET NULL |
| Deal | Lead | lead_id | SET NULL |
| PipelineStage | Pipeline | pipeline_id | CASCADE |
| PipelineStage | Organization | organization_id | CASCADE |
| DealStageHistory | Deal | deal_id | CASCADE |
| DealStageHistory | PipelineStage (to) | to_stage_id | RESTRICT |
| DealStageHistory | User (mover) | moved_by | RESTRICT |
| Pipeline | Organization | organization_id | CASCADE |

---

## Migration Order

1. `create_pipelines`
2. `create_pipeline_stages`
3. `seed_default_pipeline_stages` (5 default stages per org on signup)
4. `create_deals`
5. `create_deal_stage_history`

---

## Critical Constraints

- Stage deletion blocked if open deals exist (service-layer guard)
- At least one stage must exist (service-layer guard)
- `lost_reason NOT NULL` when `status = 'lost'` (DB CHECK)

---

## Related Specs

| Spec | Path |
|------|------|
| Deal entity | `specs/database/entities/deal.md` |
| Pipeline entity | `specs/database/entities/pipeline.md` |
| Pipeline stage entity | `specs/database/entities/pipeline-stage.md` |
| Feature spec | `specs/features/deal-pipeline-management/feature-spec.md` |
