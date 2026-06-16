# DB Spec: Company Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full entity spec: `specs/database/entities/company.md`

---

## Entity: Company → `companies`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| name | VARCHAR(255) | Yes | Unique per org (excl. soft-deleted) |
| website | VARCHAR(255) | No | |
| industry | VARCHAR(100) | No | |
| employee_count | INTEGER | No | |
| owner_id | UUID | Yes | FK → users.id |
| notes | TEXT | No | |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

---

## Relationships

| From | To | FK | On delete |
|------|----|----|-----------|
| Company | Organization | organization_id | CASCADE |
| Company | User (owner) | owner_id | RESTRICT |
| Contact | Company | company_id | SET NULL (on contacts table) |

---

## Critical Constraints

- Partial UNIQUE: `(organization_id, name)` WHERE `deleted_at IS NULL`
- Contacts linked to a deleted company have their `company_id` SET NULL

---

## Related Specs

| Spec | Path |
|------|------|
| Entity spec | `specs/database/entities/company.md` |
| Feature spec | `specs/features/company-management/feature-spec.md` |
