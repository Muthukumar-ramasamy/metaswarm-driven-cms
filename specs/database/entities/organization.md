# DB Spec: Organization

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Organization |
| Table name | `organizations` |
| Module | Auth |
| Multi-tenant | No — this IS the tenant root |

**Purpose**: Represents a single workspace/company using the CRM. Every other entity belongs to an organization. This is the root of all tenant isolation.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| name | VARCHAR(255) | Yes | — | No | No | Display name of the company |
| slug | VARCHAR(100) | Yes | — | Yes (global) | Yes | URL-safe identifier, e.g. `acme-corp` |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete — NULL means active |

**Note**: Organization has no `organization_id` column — it is the tenant root.

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| users | One-to-many | users.organization_id | organizations.id | CASCADE |
| contacts | One-to-many | contacts.organization_id | organizations.id | CASCADE |
| companies | One-to-many | companies.organization_id | organizations.id | CASCADE |
| leads | One-to-many | leads.organization_id | organizations.id | CASCADE |
| pipelines | One-to-many | pipelines.organization_id | organizations.id | CASCADE |
| deals | One-to-many | deals.organization_id | organizations.id | CASCADE |
| activities | One-to-many | activities.organization_id | organizations.id | CASCADE |
| notes | One-to-many | notes.organization_id | organizations.id | CASCADE |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX organizations_pkey ON organizations(id);
CREATE UNIQUE INDEX organizations_slug_idx ON organizations(slug);
CREATE INDEX organizations_deleted_at_idx ON organizations(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

None.

---

## 6. Business Rules (DB level)

- No `organization_id` column — this table is the tenant boundary.
- `slug` must be globally unique across all organizations.
- Soft delete only — set `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Find org by slug (used on login/signup)
SELECT * FROM organizations
WHERE slug = $1
  AND deleted_at IS NULL;

-- Get org by ID
SELECT * FROM organizations
WHERE id = $1
  AND deleted_at IS NULL;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_organizations.sql`
- Must be created before all other tables (referenced by every table's `organization_id` FK).
- Rollback: Drop table (only safe at initial setup — has cascade dependents after data exists).

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/auth/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
