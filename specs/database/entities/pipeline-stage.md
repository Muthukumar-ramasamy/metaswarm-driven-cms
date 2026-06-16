# DB Spec: Pipeline Stage

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Pipeline Stage |
| Table name | `pipeline_stages` |
| Module | Deals |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A single step within a pipeline (e.g. "Lead In", "Proposal Sent", "Negotiation"). Deals move through stages as they progress. Stages have an order and a win probability percentage that informs forecasting.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| pipeline_id | UUID | Yes | — | No | Yes (FK) | FK → pipelines.id |
| name | VARCHAR(255) | Yes | — | No | No | Stage display name e.g. "Proposal Sent" |
| display_order | INTEGER | Yes | — | No | No | Position within the pipeline (0-based) |
| probability | INTEGER | Yes | 0 | No | No | Win probability 0–100 (%) |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| pipeline | Many-to-one | pipeline_id | pipelines.id | RESTRICT |
| deals | One-to-many | deals.stage_id | pipeline_stages.id | RESTRICT |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX pipeline_stages_pkey ON pipeline_stages(id);
CREATE INDEX pipeline_stages_org_idx ON pipeline_stages(organization_id);
CREATE INDEX pipeline_stages_pipeline_idx ON pipeline_stages(pipeline_id);
CREATE UNIQUE INDEX pipeline_stages_pipeline_name_idx ON pipeline_stages(pipeline_id, name)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX pipeline_stages_pipeline_order_idx ON pipeline_stages(pipeline_id, display_order)
  WHERE deleted_at IS NULL;
CREATE INDEX pipeline_stages_deleted_at_idx ON pipeline_stages(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

None.

---

## 6. Business Rules (DB level)

- Stage names must be unique within a pipeline — enforced by partial unique index.
- `display_order` must be unique within a pipeline — enforced by partial unique index.
- `probability` must be in range 0–100 — enforced by CHECK constraint: `CHECK (probability >= 0 AND probability <= 100)`.
- A stage with open deals cannot be soft-deleted — enforced in the service layer.
- At least one stage must exist per pipeline at all times — enforced in the service layer.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Default Stages (seeded on org signup)

| display_order | name | probability |
|---------------|------|-------------|
| 0 | Lead In | 10 |
| 1 | Contact Made | 20 |
| 2 | Demo Scheduled | 40 |
| 3 | Proposal Sent | 60 |
| 4 | Negotiation | 80 |

---

## 8. Sample Queries

```sql
-- All stages for a pipeline, ordered
SELECT * FROM pipeline_stages
WHERE pipeline_id = $1
  AND organization_id = $2
  AND deleted_at IS NULL
ORDER BY display_order ASC;

-- Check if stage has open deals before deleting
SELECT COUNT(*) FROM deals
WHERE stage_id = $1
  AND status = 'open'
  AND deleted_at IS NULL;
```

---

## 9. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_pipeline_stages.sql`
- Depends on: `organizations`, `pipelines` tables.
- Seed: 5 default stages created per org at signup (see default stages table above).

---

## 10. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/deals/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
