# DB Spec: Contact Management

| Field | Value |
|-------|-------|
| Status | Approved |

---

## 1. Entity Overview

| Entity | Table | Purpose |
|--------|-------|---------|
| Contact | `contacts` | A person in the sales relationship |

Full field definition: `specs/database/entities/contact.md`

---

## 2. Key Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| first_name | VARCHAR(255) | Yes | |
| last_name | VARCHAR(255) | No | |
| email | VARCHAR(255) | No | Unique per org when set |
| phone | VARCHAR(50) | No | |
| job_title | VARCHAR(255) | No | |
| company_id | UUID | No | FK → companies.id, SET NULL on delete |
| owner_id | UUID | Yes | FK → users.id |
| source | ENUM | No | contact_source |
| notes | TEXT | No | |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

---

## 3. Relationships

| From | To | FK | On delete |
|------|----|----|-----------|
| Contact | Organization | organization_id | CASCADE |
| Contact | Company | company_id | SET NULL |
| Contact | User (owner) | owner_id | RESTRICT |

**Implementation prerequisite:** `backend/src/db/schema/companies.ts` stub must exist before `contacts.ts` can compile (Drizzle needs the reference target). The `companies` table must also exist in Neon before the contacts migration runs. User confirmed companies table already exists in Neon; create the Drizzle stub schema as part of WU-1.

---

## 4. Critical Constraints

- Partial UNIQUE: `(organization_id, email)` WHERE `deleted_at IS NULL AND email IS NOT NULL`
- Indexes: `organization_id`, `owner_id`, `company_id`, `email` (for ILIKE search performance), `deleted_at`
- Soft delete only: `deleted_at = NOW()` never `DELETE FROM`

## 4a. camelCase / snake_case Mapping

| DB column (snake_case) | TypeScript field (camelCase) |
|------------------------|------------------------------|
| first_name | firstName |
| last_name | lastName |
| owner_id | ownerId |
| company_id | companyId |
| organization_id | organizationId |
| job_title | jobTitle |
| created_at | createdAt |
| updated_at | updatedAt |
| deleted_at | deletedAt |

All API request/response bodies use camelCase. All SQL/Drizzle column definitions use snake_case.

---

## 5. Business Rules (DB level)

- Email uniqueness is per-organisation, not global. Two orgs can have the same contact email.
- `deleted_at IS NULL` must appear on every SELECT.
- All queries include `organization_id = $orgId`.

---

## 6. Related Specs

| Spec | Path |
|------|------|
| Entity spec | `specs/database/entities/contact.md` |
| Feature spec | `specs/features/contact-management/feature-spec.md` |
| API spec | `specs/features/contact-management/api-spec.md` |
