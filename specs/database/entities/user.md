# DB Spec: User

## 1. Entity Overview

| Field | Value |
|-------|-------|
| Entity name | User |
| Table name | `users` |
| Module | Auth |
| Multi-tenant | Yes (scoped by `organization_id`) |

**Purpose**: A team member who can log in and use the CRM. Every record in the system is owned by and visible to users within the same organization.

---

## 2. Fields

| Field | Type | Required | Default | Unique | Index | Description |
|-------|------|----------|---------|--------|-------|-------------|
| id | UUID | Yes | gen_random_uuid() | Yes (PK) | PK | Primary key |
| organization_id | UUID | Yes | — | No | Yes (FK) | FK → organizations.id |
| email | VARCHAR(255) | Yes | — | Yes (per org) | Yes | Login email — unique within org |
| name | VARCHAR(255) | Yes | — | No | No | Display name |
| password_hash | VARCHAR(255) | Yes | — | No | No | bcrypt hash — never returned in API |
| role | user_role ENUM | Yes | 'sales_rep' | No | Yes | admin, manager, sales_rep |
| avatar_url | VARCHAR(500) | No | NULL | No | No | Profile picture URL |
| is_active | BOOLEAN | Yes | true | No | Yes | false = deactivated, cannot login |
| last_login_at | TIMESTAMPTZ | No | NULL | No | No | Set on each successful login |
| invited_by | UUID | No | NULL | No | Yes (FK) | FK → users.id — who sent the invite |
| invite_token | VARCHAR(255) | No | NULL | No | No | Hashed invite token (cleared on accept) |
| invite_expires_at | TIMESTAMPTZ | No | NULL | No | No | Invite link expiry (72h from send) |
| invite_accepted_at | TIMESTAMPTZ | No | NULL | No | No | Timestamp when invite was accepted |
| created_at | TIMESTAMPTZ | Yes | NOW() | No | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | Yes | NOW() | No | No | Auto-updated on every mutation |
| deleted_at | TIMESTAMPTZ | No | NULL | No | Yes | Soft delete |

---

## 3. Relationships

| Relationship | Type | Foreign key | References | On delete |
|-------------|------|-------------|------------|-----------|
| organization | Many-to-one | organization_id | organizations.id | CASCADE |
| invited_by user | Many-to-one (self) | invited_by | users.id | SET NULL |
| owned contacts | One-to-many | contacts.owner_id | users.id | RESTRICT |
| owned companies | One-to-many | companies.owner_id | users.id | RESTRICT |
| owned leads | One-to-many | leads.owner_id | users.id | RESTRICT |
| owned deals | One-to-many | deals.owner_id | users.id | RESTRICT |
| owned activities | One-to-many | activities.owner_id | users.id | RESTRICT |
| authored notes | One-to-many | notes.author_id | users.id | RESTRICT |

---

## 4. Indexes

```sql
CREATE UNIQUE INDEX users_pkey ON users(id);
CREATE INDEX users_org_idx ON users(organization_id);
CREATE UNIQUE INDEX users_org_email_idx ON users(organization_id, email) WHERE deleted_at IS NULL;
CREATE INDEX users_role_idx ON users(organization_id, role);
CREATE INDEX users_is_active_idx ON users(organization_id, is_active);
CREATE INDEX users_deleted_at_idx ON users(deleted_at) WHERE deleted_at IS NULL;
```

---

## 5. Enums

```sql
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'sales_rep'
);
```

---

## 6. Business Rules (DB level)

- `email` is unique per organization (not globally) — enforced by the composite unique index.
- `password_hash` must never be returned in any API response.
- `invite_token` is stored as a hash, not plaintext — cleared once `invite_accepted_at` is set.
- Deactivated users (`is_active = false`) must not be able to log in — enforced in the auth service.
- Soft delete only — set `deleted_at = NOW()`, never `DELETE`.
- An org must always have at least one `admin` user — enforced in the user service before deactivation.
- `updated_at` auto-updated on every mutation via ORM hook.

---

## 7. Sample Queries

```sql
-- Find user by email for login
SELECT id, organization_id, role, password_hash, is_active
FROM users
WHERE organization_id = $1
  AND email = $2
  AND deleted_at IS NULL;

-- List active users in org
SELECT id, name, email, role, is_active, last_login_at
FROM users
WHERE organization_id = $1
  AND deleted_at IS NULL
ORDER BY name ASC;

-- Check org still has at least one admin before deactivating
SELECT COUNT(*) FROM users
WHERE organization_id = $1
  AND role = 'admin'
  AND is_active = true
  AND deleted_at IS NULL
  AND id != $2;   -- exclude the user being deactivated
```

---

## 8. Migration Notes

- Migration: `backend/migrations/{timestamp}_create_users.sql`
- Depends on: `organizations` table.
- Seed: one admin user per org (created during signup flow — not a seed file).

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/auth/feature-spec.md` |
| Schema registry | `specs/database/schema.md` |
| ERD | `specs/database/erd.md` |
