# DB Spec: Pipeline

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Pipeline |
| Table name | `pipelines` |
| Module | Deals |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A named, ordered sequence of stages that deals move through. In the MVP there is exactly one pipeline per organization. The pipeline is the container for all deals.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| name | VARCHAR(255) | Yes | — | No | No | Pipeline display name e.g. "Sales Pipeline" |
| is_default | BOOLEAN | Yes | false | No | Yes | True for the one default pipeline per org |
| display_order | INTEGER | Yes | 0 | No | No | Display order if multiple pipelines exist (post-MVP) |
| created_by | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |
| stages | One-to-many | pipeline_stages.pipeline_id | pipelines.id | RESTRICT |
| deals | One-to-many | deals.pipeline_id | pipelines.id | RESTRICT |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX pipelines_pkey ON pipelines(id);
CREATE INDEX pipelines_org_idx ON pipelines(organization_id);
CREATE UNIQUE INDEX pipelines_org_default_idx ON pipelines(organization_id)
  WHERE is_default = true AND deleted_at IS NULL;
CREATE INDEX pipelines_deleted_at_idx ON pipelines(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

None.

---

## 6. Business Rules (DB level)

- Exactly one pipeline per organization must have `is_default = true` — enforced by partial unique index.
- A pipeline with active deals or stages cannot be soft-deleted — enforced in the service layer.
- In MVP, the signup flow creates one default pipeline with pre-seeded stages automatically.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Get the default pipeline for an org (used on deal create / board view)
SELECT * FROM pipelines
WHERE organization_id = $1
  AND is_default = true
  AND deleted_at IS NULL
LIMIT 1;

-- Get pipeline with its stages
SELECT p.*, ps.id AS stage_id, ps.name AS stage_name, ps.display_order, ps.probability
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.deleted_at IS NULL
WHERE p.id = $1
  AND p.organization_id = $2
  AND p.deleted_at IS NULL
ORDER BY ps.display_order ASC;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_pipelines.sql`
- Depends on: `organizations`, `users` tables.
- Seed: the signup flow auto-creates one pipeline named "Sales Pipeline" with default stages.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/deals/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
