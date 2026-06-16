# DB Spec: Deal

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Deal |
| Table name | `deals` |
| Module | Deals |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A qualified sales opportunity with a monetary value, an expected close date, and a position in the pipeline. The deal is the central record of the CRM — activities, notes, and tasks all flow through it. It ends as Won or Lost.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| pipeline_id | UUID | Yes | — | No | Yes (FK) | FK → pipelines.id |
| stage_id | UUID | Yes | — | No | Yes (FK) | FK → pipeline_stages.id |
| owner_id | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| contact_id | UUID | Yes | — | No | Yes (FK) | FK → contacts.id — primary contact |
| company_id | UUID | No | NULL | No | Yes (FK) | FK → companies.id — optional |
| lead_id | UUID | No | NULL | No | Yes (FK) | FK → leads.id — if converted from lead |
| title | VARCHAR(255) | Yes | — | No | No | Deal name / description |
| value | NUMERIC(15,2) | Yes | 0.00 | No | No | Deal monetary value (USD) |
| status | deal_status ENUM | Yes | 'open' | No | Yes | open, won, lost |
| lost_reason | VARCHAR(500) | No | NULL | No | No | Required when status = 'lost' |
| expected_close_date | DATE | No | NULL | No | No | Forecast close date |
| won_at | TIMESTAMPTZ | No | NULL | No | No | Set when status → won |
| lost_at | TIMESTAMPTZ | No | NULL | No | No | Set when status → lost |
| created_by | UUID | Yes | — | No | Yes (FK) | FK → users.id |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | Yes | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| pipeline | Many-to-one | pipeline_id | pipelines.id | RESTRICT |
| stage | Many-to-one | stage_id | pipeline_stages.id | RESTRICT |
| owner | Many-to-one | owner_id | users.id | RESTRICT |
| contact | Many-to-one | contact_id | contacts.id | RESTRICT |
| company | Many-to-one (optional) | company_id | companies.id | SET NULL |
| source lead | Many-to-one (optional) | lead_id | leads.id | SET NULL |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |
| activities | One-to-many | activities.deal_id | deals.id | SET NULL |
| notes | One-to-many | notes.deal_id | deals.id | SET NULL |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX deals_pkey ON deals(id);
CREATE INDEX deals_org_idx ON deals(organization_id);
CREATE INDEX deals_pipeline_idx ON deals(pipeline_id);
CREATE INDEX deals_stage_idx ON deals(stage_id);
CREATE INDEX deals_owner_idx ON deals(owner_id);
CREATE INDEX deals_contact_idx ON deals(contact_id);
CREATE INDEX deals_company_idx ON deals(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX deals_lead_idx ON deals(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX deals_status_idx ON deals(organization_id, status);
CREATE INDEX deals_created_at_idx ON deals(organization_id, created_at DESC);
CREATE INDEX deals_deleted_at_idx ON deals(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

```sql
CREATE TYPE deal_status AS ENUM (
  'open',
  'won',
  'lost'
);
```

---

## 6. Business Rules (DB level)

- `lost_reason` is required when `status = 'lost'` — enforced by CHECK constraint:
  `CHECK (status != 'lost' OR (status = 'lost' AND lost_reason IS NOT NULL))`.
- `won_at` must be set when `status → 'won'`, `lost_at` when `status → 'lost'` — enforced in service layer.
- `stage_id` must belong to the same `pipeline_id` — enforced in service layer before insert/update.
- A deal's `stage_id` must belong to a stage within the deal's `pipeline_id` — enforced in service.
- Won and lost deals are retained forever (they cannot be hard-deleted).
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Pipeline board: open deals grouped by stage for an org
SELECT d.*, ps.name AS stage_name, ps.display_order,
       c.first_name, c.last_name, co.name AS company_name
FROM deals d
JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.deleted_at IS NULL
LEFT JOIN contacts c ON c.id = d.contact_id AND c.deleted_at IS NULL
LEFT JOIN companies co ON co.id = d.company_id AND co.deleted_at IS NULL
WHERE d.organization_id = $1
  AND d.pipeline_id = $2
  AND d.status = 'open'
  AND d.deleted_at IS NULL
ORDER BY ps.display_order ASC, d.created_at DESC;

-- Won deals in a date range (for reports)
SELECT COUNT(*) AS count, SUM(value) AS total_value
FROM deals
WHERE organization_id = $1
  AND status = 'won'
  AND won_at BETWEEN $2 AND $3
  AND deleted_at IS NULL;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_deals.sql`
- Depends on: `organizations`, `users`, `contacts`, `companies`, `pipelines`, `pipeline_stages`, `leads` tables.
- After `deals` is created, add the circular FK on `leads.converted_deal_id` via `ALTER TABLE`.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/deals/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
