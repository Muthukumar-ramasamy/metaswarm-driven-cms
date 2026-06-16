# DB Spec: Note

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | Note |
| Table name | `notes` |
| Module | Notes (cross-module) |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: Free-text context attached to any CRM record (deal, contact, company, or lead). Notes accumulate the qualitative history of a relationship — meeting summaries, key insights, and reminders that don't fit structured fields.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| author_id | UUID | Yes | — | No | Yes (FK) | FK → users.id — the note writer |
| deal_id | UUID | No | NULL | No | Yes (FK) | FK → deals.id |
| contact_id | UUID | No | NULL | No | Yes (FK) | FK → contacts.id |
| company_id | UUID | No | NULL | No | Yes (FK) | FK → companies.id |
| lead_id | UUID | No | NULL | No | Yes (FK) | FK → leads.id |
| content | TEXT | Yes | — | No | No | Note body (markdown supported) |
| is_pinned | BOOLEAN | Yes | false | No | No | Pin to top of record's note list |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | Yes | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| author | Many-to-one | author_id | users.id | RESTRICT |
| deal | Many-to-one (optional) | deal_id | deals.id | SET NULL |
| contact | Many-to-one (optional) | contact_id | contacts.id | SET NULL |
| company | Many-to-one (optional) | company_id | companies.id | SET NULL |
| lead | Many-to-one (optional) | lead_id | leads.id | SET NULL |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX notes_pkey ON notes(id);
CREATE INDEX notes_org_idx ON notes(organization_id);
CREATE INDEX notes_author_idx ON notes(author_id);
CREATE INDEX notes_deal_idx ON notes(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX notes_contact_idx ON notes(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX notes_company_idx ON notes(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX notes_lead_idx ON notes(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX notes_created_at_idx ON notes(organization_id, created_at DESC);
CREATE INDEX notes_deleted_at_idx ON notes(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

None.

---

## 6. Business Rules (DB level)

- A note must be linked to at least one of: `deal_id`, `contact_id`, `company_id`, `lead_id` — enforced by CHECK constraint:
  `CHECK (deal_id IS NOT NULL OR contact_id IS NOT NULL OR company_id IS NOT NULL OR lead_id IS NOT NULL)`.
- Soft delete only — `deleted_at = NOW()`, never `DELETE`.
- Only the author or an Admin can edit/delete a note — enforced in service layer.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Notes for a deal, pinned first
SELECT n.*, u.name AS author_name
FROM notes n
JOIN users u ON u.id = n.author_id
WHERE n.deal_id = $1
  AND n.organization_id = $2
  AND n.deleted_at IS NULL
ORDER BY n.is_pinned DESC, n.created_at DESC;

-- All notes authored by a user (for audit)
SELECT * FROM notes
WHERE author_id = $1
  AND organization_id = $2
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_notes.sql`
- Depends on: `organizations`, `users`, `deals`, `contacts`, `companies`, `leads` tables.
- The multi-column CHECK constraint for "at least one linked record" is applied at migration time.

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/notes/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
