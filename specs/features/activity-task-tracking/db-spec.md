# DB Spec: Activity & Task Tracking

| Field | Value |
|-------|-------|
| Status | Approved |

Full entity spec: `specs/database/entities/activity.md`

---

## Entity: Activity → `activities`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| type | ENUM | Yes | call, email, meeting, demo, lunch, other |
| subject | VARCHAR(255) | Yes | |
| notes | TEXT | No | Outcome note when marking done |
| done | BOOLEAN | Yes | Default false; true = logged activity |
| done_at | TIMESTAMPTZ | No | Set when done → true |
| due_date | DATE | No | For tasks (done = false) |
| owner_id | UUID | Yes | FK → users.id |
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
| Activity | Organization | organization_id | CASCADE |
| Activity | User (owner) | owner_id | RESTRICT |
| Activity | Deal | deal_id | SET NULL |
| Activity | Contact | contact_id | SET NULL |
| Activity | Company | company_id | SET NULL |
| Activity | Lead | lead_id | SET NULL |

---

## Critical Constraints

- At least one linked record (DB-level CHECK)
- `done_at` is set once; service prevents changing it after the fact

---

## Related Specs

| Spec | Path |
|------|------|
| Entity spec | `specs/database/entities/activity.md` |
| Feature spec | `specs/features/activity-task-tracking/feature-spec.md` |
