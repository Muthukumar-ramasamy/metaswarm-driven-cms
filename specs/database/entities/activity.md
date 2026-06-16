# DB Spec: Activity

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Activity |
| Table name | `activities` |
| Module | Activities & Tasks |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A single interaction or planned action. Activities cover both past interactions (logged calls, emails, meetings — `done = true`) and future tasks (scheduled follow-ups — `done = false`). One table serves both use cases; the `done` flag distinguishes them.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| owner_id | UUID | Yes | — | No | Yes (FK) | FK → users.id — responsible rep |
| deal_id | UUID | No | NULL | No | Yes (FK) | FK → deals.id |
| contact_id | UUID | No | NULL | No | Yes (FK) | FK → contacts.id |
| company_id | UUID | No | NULL | No | Yes (FK) | FK → companies.id |
| lead_id | UUID | No | NULL | No | Yes (FK) | FK → leads.id |
| type | activity_type ENUM | Yes | — | No | Yes | call, email, meeting, demo, lunch, other |
| subject | VARCHAR(255) | Yes | — | No | No | Short description of the activity |
| note | TEXT | No | NULL | No | No | Free-text detail / meeting notes |
| outcome | VARCHAR(500) | No | NULL | No | No | What resulted from the activity |
| done | BOOLEAN | Yes | false | No | Yes | true = logged/completed, false = upcoming task |
| done_at | TIMESTAMPTZ | No | NULL | No | No | When the activity was completed |
| due_date | DATE | No | NULL | No | Yes | Due date for tasks (done = false) |
| due_time | TIME | No | NULL | No | No | Optional time component of due_date |
| duration_minutes | INTEGER | No | NULL | No | No | Duration of the interaction |
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
| deal | Many-to-one (optional) | deal_id | deals.id | SET NULL |
| contact | Many-to-one (optional) | contact_id | contacts.id | SET NULL |
| company | Many-to-one (optional) | company_id | companies.id | SET NULL |
| lead | Many-to-one (optional) | lead_id | leads.id | SET NULL |
| created_by user | Many-to-one | created_by | users.id | RESTRICT |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX activities_pkey ON activities(id);
CREATE INDEX activities_org_idx ON activities(organization_id);
CREATE INDEX activities_owner_idx ON activities(owner_id);
CREATE INDEX activities_deal_idx ON activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX activities_contact_idx ON activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX activities_company_idx ON activities(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX activities_lead_idx ON activities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX activities_done_idx ON activities(organization_id, owner_id, done);
CREATE INDEX activities_due_date_idx ON activities(owner_id, due_date) WHERE done = false AND deleted_at IS NULL;
CREATE INDEX activities_deleted_at_idx ON activities(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

```sql
CREATE TYPE activity_type AS ENUM (
  'call',
  'email',
  'meeting',
  'demo',
  'lunch',
  'other'
);
```

---

## 6. Business Rules (DB level)

- An activity must be linked to at least one of: `deal_id`, `contact_id`, `company_id`, `lead_id` — enforced by CHECK constraint:
  `CHECK (deal_id IS NOT NULL OR contact_id IS NOT NULL OR company_id IS NOT NULL OR lead_id IS NOT NULL)`.
- `done_at` is set when `done` transitions to `true` — it must not be changed after being set (enforced in service).
- `due_date` is required when `done = false` and the record represents a scheduled task — enforced in service layer.
- `duration_minutes` must be > 0 when provided — enforced by CHECK constraint.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- My upcoming tasks (task list view)
SELECT a.*, d.title AS deal_title, c.first_name, c.last_name
FROM activities a
LEFT JOIN deals d ON d.id = a.deal_id AND d.deleted_at IS NULL
LEFT JOIN contacts c ON c.id = a.contact_id AND c.deleted_at IS NULL
WHERE a.organization_id = $1
  AND a.owner_id = $2
  AND a.done = false
  AND a.deleted_at IS NULL
ORDER BY a.due_date ASC NULLS LAST, a.created_at ASC;

-- Activity feed for a deal
SELECT a.*, u.name AS owner_name
FROM activities a
JOIN users u ON u.id = a.owner_id
WHERE a.deal_id = $1
  AND a.organization_id = $2
  AND a.deleted_at IS NULL
ORDER BY a.created_at DESC;

-- Overdue tasks (due_date < today, done = false)
SELECT * FROM activities
WHERE organization_id = $1
  AND owner_id = $2
  AND done = false
  AND due_date < CURRENT_DATE
  AND deleted_at IS NULL;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_activities.sql`
- Depends on: `organizations`, `users`, `deals`, `contacts`, `companies`, `leads` tables.
- The multi-column CHECK constraint for "at least one linked record" is applied at migration time.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/activities/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
