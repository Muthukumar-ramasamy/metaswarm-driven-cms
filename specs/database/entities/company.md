# DB Spec: Company

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Company |
| Table name | `companies` |
| Module | Companies |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A business or organisation that the sales team sells into. Companies group contacts and deals under a single account, giving a complete view of the relationship with that business.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| owner_id | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| name | VARCHAR(255) | Yes | — | Yes (per org) | Yes | Company display name |
| domain | VARCHAR(255) | No | NULL | No | No | Web domain e.g. acme.com |
| industry | VARCHAR(255) | No | NULL | No | No | Industry sector |
| employee_count | INTEGER | No | NULL | No | No | Approximate headcount |
| annual_revenue | NUMERIC(15,2) | No | NULL | No | No | Annual revenue (USD) |
| country | VARCHAR(100) | No | NULL | No | No | Country |
| city | VARCHAR(255) | No | NULL | No | No | City |
| address | VARCHAR(500) | No | NULL | No | No | Street address |
| website | VARCHAR(500) | No | NULL | No | No | Website URL |
| created_by | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| owner | Many-to-one | owner_id | users.id | RESTRICT |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |
| contacts | One-to-many | contacts.company_id | companies.id | SET NULL |
| leads | One-to-many | leads.company_id | companies.id | SET NULL |
| deals | One-to-many | deals.company_id | companies.id | SET NULL |
| activities | One-to-many | activities.company_id | companies.id | SET NULL |
| notes | One-to-many | notes.company_id | companies.id | SET NULL |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX companies_pkey ON companies(id);
CREATE INDEX companies_org_idx ON companies(organization_id);
CREATE INDEX companies_owner_idx ON companies(owner_id);
CREATE UNIQUE INDEX companies_org_name_idx ON companies(organization_id, name)
  WHERE deleted_at IS NULL;
CREATE INDEX companies_deleted_at_idx ON companies(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

None.

---

## 6. Business Rules (DB level)

- `name` must be unique per organization (enforced by partial unique index excluding soft-deleted).
- Deleting a company does not delete its contacts — FK is SET NULL.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- List companies with contact count
SELECT co.*, COUNT(c.id) AS contact_count
FROM companies co
LEFT JOIN contacts c ON c.company_id = co.id AND c.deleted_at IS NULL
WHERE co.organization_id = $1
  AND co.deleted_at IS NULL
GROUP BY co.id
ORDER BY co.name ASC
LIMIT $2 OFFSET $3;

-- Get company with all associated contacts
SELECT co.*, c.id AS contact_id, c.first_name, c.last_name, c.email
FROM companies co
LEFT JOIN contacts c ON c.company_id = co.id AND c.deleted_at IS NULL
WHERE co.id = $1
  AND co.organization_id = $2
  AND co.deleted_at IS NULL;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_companies.sql`
- Depends on: `organizations`, `users` tables.
- Note: Create `companies` before `contacts` to allow contacts' `company_id` FK to resolve.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/companies/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
