# DB Spec: Contact

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Contact |
| Table name | `contacts` |
| Module | Contacts |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: An individual person the sales team interacts with. Contacts are the human side of every deal and relationship — they belong to companies, are linked to leads and deals, and accumulate a history of activities and notes.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| owner_id | UUID | Yes | — | No | Yes (FK) | FK → users.id — assigned sales rep |
| company_id | UUID | No | NULL | No | Yes (FK) | FK → companies.id — optional employer |
| first_name | VARCHAR(255) | Yes | — | No | No | Given name |
| last_name | VARCHAR(255) | Yes | — | No | No | Family name |
| email | VARCHAR(255) | No | NULL | Yes (per org) | Yes | Primary email — unique within org if set |
| phone | VARCHAR(50) | No | NULL | No | No | Primary phone number |
| job_title | VARCHAR(255) | No | NULL | No | No | Role at their company |
| linkedin_url | VARCHAR(500) | No | NULL | No | No | LinkedIn profile URL |
| source | contact_source ENUM | No | 'manual' | No | No | How the contact was created |
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
| company | Many-to-one (optional) | company_id | companies.id | SET NULL |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |
| leads | One-to-many | leads.contact_id | contacts.id | SET NULL |
| deals | One-to-many | deals.contact_id | contacts.id | RESTRICT |
| activities | One-to-many | activities.contact_id | contacts.id | SET NULL |
| notes | One-to-many | notes.contact_id | contacts.id | SET NULL |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX contacts_pkey ON contacts(id);
CREATE INDEX contacts_org_idx ON contacts(organization_id);
CREATE INDEX contacts_owner_idx ON contacts(owner_id);
CREATE INDEX contacts_company_idx ON contacts(company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX contacts_org_email_idx ON contacts(organization_id, email)
  WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX contacts_deleted_at_idx ON contacts(deleted_at) WHERE deleted_at IS NULL;
-- Full-text search across name fields
CREATE INDEX contacts_name_search_idx ON contacts(organization_id, first_name, last_name);
```

---

## 5. Enums

```sql
CREATE TYPE contact_source AS ENUM (
  'manual',
  'import',
  'web_form',
  'api',
  'lead_conversion'
);
```

---

## 6. Business Rules (DB level)

- `email` is optional but must be unique per organization when provided.
- When a company is deleted (soft), `company_id` on linked contacts is set to NULL (via ON DELETE SET NULL).
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- A contact with active deals cannot be hard-deleted (FK RESTRICT on deals.contact_id).
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- List contacts owned by a specific user
SELECT c.*, co.name AS company_name
FROM contacts c
LEFT JOIN companies co ON co.id = c.company_id AND co.deleted_at IS NULL
WHERE c.organization_id = $1
  AND c.owner_id = $2
  AND c.deleted_at IS NULL
ORDER BY c.last_name ASC, c.first_name ASC
LIMIT $3 OFFSET $4;

-- Search contacts by name or email
SELECT * FROM contacts
WHERE organization_id = $1
  AND deleted_at IS NULL
  AND (
    first_name ILIKE $2 OR
    last_name  ILIKE $2 OR
    email      ILIKE $2
  )
ORDER BY last_name ASC;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_contacts.sql`
- Depends on: `organizations`, `users`, `companies` tables.
- Note: `companies` and `contacts` have a mutual soft-dependency — create contacts with `company_id` nullable, add FK after companies table exists.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/contacts/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
