# DB Spec: Auth & User Management

| Field | Value |
|-------|-------|
| Status | Approved |
| Phase | Full schema created in Phase 1 migration; Phase 2 fields unused until Phase 2 |
| Last updated | 2026-06-16 |

> **Scope note**: The full DB schema is created in Phase 1 migrations (including Phase 2 fields like `invite_token`, `password_reset_token`). This avoids ALTER TABLE operations on a populated table later. Only the Phase 1-used fields are populated by Phase 1 endpoints.

---

## 1. Entities Overview

| Entity | Table | Purpose |
|--------|-------|---------|
| Organization | `organizations` | Tenant root — owns all other records |
| User | `users` | Team member; authentication identity |

---

## 2. Schema

### organizations

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK — gen_random_uuid() |
| name | VARCHAR(255) | Yes | Workspace display name |
| slug | VARCHAR(100) | Yes | Globally unique, URL-safe |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

### users

| Field | Type | Required | Phase | Notes |
|-------|------|----------|-------|-------|
| id | UUID | Yes | 1 | PK — gen_random_uuid() |
| organization_id | UUID | Yes | 1 | FK → organizations.id |
| first_name | VARCHAR(255) | Yes | 1 | |
| last_name | VARCHAR(255) | No | 1 | |
| email | VARCHAR(255) | Yes | 1 | Unique per org (partial unique index) |
| password_hash | VARCHAR(255) | Yes | 1 | bcrypt, 12 rounds |
| role | ENUM | Yes | 1 | admin, manager, sales_rep; default: admin |
| status | ENUM | Yes | 1 | active, pending, deactivated; default: active |
| invite_token | VARCHAR(255) | No | **2** | Cleared on accept |
| invite_token_expires_at | TIMESTAMPTZ | No | **2** | 72h from invite creation |
| password_reset_token | VARCHAR(255) | No | **2** | 1h expiry |
| password_reset_expires_at | TIMESTAMPTZ | No | **2** | |
| deactivated_at | TIMESTAMPTZ | No | **2** | Set when user is deactivated |
| created_at | TIMESTAMPTZ | Yes | 1 | |
| updated_at | TIMESTAMPTZ | Yes | 1 | |
| deleted_at | TIMESTAMPTZ | No | 1 | Soft delete |

**Enums** (created in migration before table):
- `user_role`: `admin`, `manager`, `sales_rep`
- `user_status`: `active`, `pending`, `deactivated`

---

## 3. Indexes

| Table | Index | Type | Columns | Condition |
|-------|-------|------|---------|-----------|
| organizations | `organizations_slug_unique_idx` | UNIQUE (partial) | slug | WHERE deleted_at IS NULL |
| users | `users_org_idx` | INDEX | organization_id | — |
| users | `users_org_email_unique_idx` | UNIQUE (partial) | organization_id, email | WHERE deleted_at IS NULL |

---

## 4. Relationships

| From | To | Type | FK | On delete |
|------|----|------|----|----|
| User | Organization | Many-to-one | organization_id | CASCADE |

---

## 5. Critical Constraints

- Composite UNIQUE: `(organization_id, email)` WHERE `deleted_at IS NULL`
- Partial UNIQUE on `organizations.slug` WHERE `deleted_at IS NULL`
- BR-01 (last admin guard): enforced at service layer in Phase 2 — DB cannot enforce this

---

## 6. Business Rules (DB level)

- Soft delete only: `deleted_at = NOW()` — never `DELETE FROM`
- All queries scoped by `organization_id`
- `password_hash`, `invite_token`, `password_reset_token` must never be returned in API responses

---

## 7. Migration Files

| File | Creates | Phase |
|------|---------|-------|
| `backend/drizzle/0001_create_organizations.sql` | `organizations` table | 1 |
| `backend/drizzle/0002_create_users.sql` | `user_role` enum, `user_status` enum, `users` table, indexes | 1 |

> Migration path per CLAUDE.md: `backend/drizzle/` (not `backend/src/migrations/`).
> Use `CREATE TYPE IF NOT EXISTS` for enums to prevent errors on re-run.

---

## 8. Drizzle Schema Location

| File | Table |
|------|-------|
| `backend/src/db/schema/organizations.ts` | `organizations` |
| `backend/src/db/schema/users.ts` | `users` (+ enums) |
| `backend/src/db/index.ts` | Drizzle client (Neon serverless) |

---

## 9. Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/auth-user-management/feature-spec.md` |
| API spec | `specs/features/auth-user-management/api-spec.md` |
| Organization entity | `specs/database/entities/organization.md` |
| User entity | `specs/database/entities/user.md` |
