# DB Spec: {EntityName}

> This template defines the database contract for one entity.
> The backend agent reads this to generate the schema and migration.

---

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | {EntityName} |
| Table name | `{table_name}` |
| Module | {Module} |
| Multi-tenant | Yes (scoped by `organization_id`) / No |

**Purpose**: {One sentence — what does this entity represent?}

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | Tenant scoping |
| {field_1} | VARCHAR(255) | Yes | — | No | No | {description} |
| {field_2} | VARCHAR(255) | No | NULL | No | No | {description} |
| status | ENUM | Yes | 'active' | No | Yes | {list enum values} |
| assigned_to | UUID | No | NULL | No | Yes (FK) | FK → users.id |
| notes | TEXT | No | NULL | No | No | Free text notes |
| created_by | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | Yes | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| assigned user | Many-to-one | assigned_to | users.id | SET NULL |
| created by | Many-to-one | created_by | users.id | RESTRICT |
| {related entity} | One-to-many | — | {table}.{entity}_id | CASCADE |

---

## 4. Indexes

```sql
-- Primary key (auto-created)
CREATE UNIQUE INDEX {table}_pkey ON {table_name}(id);

-- Tenant scoping (on every query)
CREATE INDEX {table}_org_idx ON {table_name}(organization_id);

-- Soft delete filter (commonly queried)
CREATE INDEX {table}_deleted_at_idx ON {table_name}(deleted_at) WHERE deleted_at IS NULL;

-- Assigned user (for "my items" queries)
CREATE INDEX {table}_assigned_to_idx ON {table_name}(assigned_to);

-- Status filter
CREATE INDEX {table}_status_idx ON {table_name}(status);

-- Composite: org + status (most common list query)
CREATE INDEX {table}_org_status_idx ON {table_name}(organization_id, status);
```

---

## 5. Enums

```sql
CREATE TYPE {entity}_status AS ENUM (
  'new',
  'active',
  'closed',
  '{add values}'
);
```

---

## 6. Business Rules (DB level)

- Soft delete only — never `DELETE FROM {table_name}`. Always set `deleted_at = NOW()`.
- All queries must include `WHERE organization_id = $orgId` for tenant isolation.
- `updated_at` must be auto-updated via trigger or ORM hook on every mutation.

---

## 7. Sample Queries

```sql
-- List active records for an organization
SELECT * FROM {table_name}
WHERE organization_id = $1
  AND deleted_at IS NULL
  AND status != 'closed'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Get single record with owner info
SELECT e.*, u.name as assigned_to_name
FROM {table_name} e
LEFT JOIN users u ON u.id = e.assigned_to
WHERE e.id = $1
  AND e.organization_id = $2
  AND e.deleted_at IS NULL;
```

---

## 8. Migration Notes

- Migration file: `backend/migrations/{timestamp}_create_{table_name}.sql`
- Rollback: Drop table (safe — new table, no existing data)
- Seed data: `backend/seeds/{table_name}.seed.ts`

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/{feature}/feature-spec.md` |
| API spec | `specs/api/openapi.yaml` |
| Schema file | `specs/database/schema.md` |
