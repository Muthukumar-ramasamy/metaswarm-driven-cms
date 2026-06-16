# DB Spec: Lead

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Lead |
| Table name | `leads` |
| Module | Leads |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: An unqualified inbound prospect that sits in the Leads Inbox before being converted to a deal. A lead is a pre-deal record — it is never deleted after conversion, providing a full audit trail from first contact to closed deal.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| owner_id | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| contact_id | UUID | No | NULL | No | Yes (FK) | FK → contacts.id — optional person |
| company_id | UUID | No | NULL | No | Yes (FK) | FK → companies.id — optional company |
| title | VARCHAR(255) | Yes | — | No | No | Opportunity description |
| value | NUMERIC(15,2) | No | 0.00 | No | No | Estimated deal value (USD) |
| status | lead_status ENUM | Yes | 'new' | No | Yes | Qualification status |
| source | lead_source ENUM | No | 'manual' | No | No | How the lead arrived |
| expected_close_date | DATE | No | NULL | No | No | Estimated conversion date |
| converted_deal_id | UUID | No | NULL | No | Yes (FK) | FK → deals.id — set on conversion |
| converted_at | TIMESTAMPTZ | No | NULL | No | No | Timestamp of conversion |
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
| contact | Many-to-one (optional) | contact_id | contacts.id | SET NULL |
| company | Many-to-one (optional) | company_id | companies.id | SET NULL |
| converted deal | One-to-one (optional) | converted_deal_id | deals.id | SET NULL |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |
| activities | One-to-many | activities.lead_id | leads.id | SET NULL |
| notes | One-to-many | notes.lead_id | leads.id | SET NULL |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX leads_pkey ON leads(id);
CREATE INDEX leads_org_idx ON leads(organization_id);
CREATE INDEX leads_owner_idx ON leads(owner_id);
CREATE INDEX leads_status_idx ON leads(organization_id, status);
CREATE INDEX leads_contact_idx ON leads(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX leads_company_idx ON leads(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX leads_converted_deal_idx ON leads(converted_deal_id) WHERE converted_deal_id IS NOT NULL;
CREATE INDEX leads_deleted_at_idx ON leads(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

```sql
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'disqualified',
  'converted'
);

CREATE TYPE lead_source AS ENUM (
  'manual',
  'import',
  'web_form',
  'api',
  'referral',
  'other'
);
```

---

## 6. Business Rules (DB level)

- A lead can only be converted once — `converted_deal_id` and `converted_at` are set atomically in a transaction.
- Once `status = 'converted'`, it must not change — enforced in the service layer.
- A converted lead record is never deleted — it is the audit trail for the deal.
- `status = 'converted'` requires `converted_deal_id IS NOT NULL` — enforced at the service/DB constraint level.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Leads inbox: open leads for a specific owner
SELECT l.*, c.first_name, c.last_name, co.name AS company_name
FROM leads l
LEFT JOIN contacts c ON c.id = l.contact_id AND c.deleted_at IS NULL
LEFT JOIN companies co ON co.id = l.company_id AND co.deleted_at IS NULL
WHERE l.organization_id = $1
  AND l.owner_id = $2
  AND l.status IN ('new', 'contacted')
  AND l.deleted_at IS NULL
ORDER BY l.created_at DESC;

-- Convert lead: atomic transaction
BEGIN;
  INSERT INTO deals (...) VALUES (...) RETURNING id INTO deal_id;
  UPDATE leads
  SET status = 'converted',
      converted_deal_id = deal_id,
      converted_at = NOW(),
      updated_at = NOW()
  WHERE id = $1 AND organization_id = $2;
COMMIT;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_leads.sql`
- Depends on: `organizations`, `users`, `contacts`, `companies` tables.
- `converted_deal_id` FK to `deals` must be added after `deals` table is created (circular dependency — add as ALTER TABLE).

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/leads/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
