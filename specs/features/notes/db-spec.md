# DB Spec: Notes

| Field | Value |
|-------|-------|
| Status | Approved |

Full entity spec: `specs/database/entities/note.md`

---

## Entity: Note → `notes`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| content | TEXT | Yes | Plain text only |
| author_id | UUID | Yes | FK → users.id; set on creation; immutable |
| is_pinned | BOOLEAN | Yes | Default false |
| deal_id | UUID | No | FK → deals.id, SET NULL |
| contact_id | UUID | No | FK → contacts.id, SET NULL |
| company_id | UUID | No | FK → companies.id, SET NULL |
| lead_id | UUID | No | FK → leads.id, SET NULL |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

DB CHECK: `deal_id IS NOT NULL OR contact_id IS NOT NULL OR company_id IS NOT NULL OR lead_id IS NOT NULL`

---

## Relationships

| From | To | FK | On Delete |
|------|----|----|-----------|
| Note | Organization | organization_id | CASCADE |
| Note | User (author) | author_id | RESTRICT |
| Note | Deal | deal_id | SET NULL |
| Note | Contact | contact_id | SET NULL |
| Note | Company | company_id | SET NULL |
| Note | Lead | lead_id | SET NULL |

---

## Critical Constraints

- `author_id` is set on creation and must not be changeable by the API
- Pinned notes always sorted before unpinned (ORDER BY is_pinned DESC, created_at DESC)

---

## Related Specs

| Spec | Path |
|------|------|
| Entity spec | `specs/database/entities/note.md` |
| Feature spec | `specs/features/notes/feature-spec.md` |
