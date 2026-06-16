# Database Schema

This file is the Architect Agent's reference for all existing entities.
Update this file every time a new entity is added or an existing one is changed.

---

## Entities

| Entity | Table | Module | Status | DB Spec |
|--------|-------|--------|--------|---------|
| Organization | organizations | Auth | ✅ Approved | [organization.md](entities/organization.md) |
| User | users | Auth | ✅ Approved | [user.md](entities/user.md) |
| Contact | contacts | Contacts | ✅ Approved | [contact.md](entities/contact.md) |
| Company | companies | Companies | ✅ Approved | [company.md](entities/company.md) |
| Lead | leads | Leads | ✅ Approved | [lead.md](entities/lead.md) |
| Pipeline | pipelines | Deals | ✅ Approved | [pipeline.md](entities/pipeline.md) |
| Pipeline Stage | pipeline_stages | Deals | ✅ Approved | [pipeline-stage.md](entities/pipeline-stage.md) |
| Deal | deals | Deals | ✅ Approved | [deal.md](entities/deal.md) |
| Activity | activities | Activities & Tasks | ✅ Approved | [activity.md](entities/activity.md) |
| Note | notes | Notes | ✅ Approved | [note.md](entities/note.md) |

---

## Relationships Overview

```
Organization
  └── Users (many)
  └── Contacts (many)
  └── Companies (many)
  └── Leads (many)
  └── Pipelines (many)
  └── Deals (many)
  └── Activities (many)
  └── Notes (many)

Company
  └── Contacts (many, company_id SET NULL on company delete)
  └── Leads (many, optional)
  └── Deals (many, optional)

Contact
  └── Company (belongs to, optional)
  └── Leads (many)
  └── Deals (many — RESTRICT delete)
  └── Activities (many)
  └── Notes (many)

Lead
  └── Contact (belongs to, optional)
  └── Company (belongs to, optional)
  └── Deal (converts to — 1:1, converted_deal_id)
  └── Activities (many)
  └── Notes (many)

Pipeline
  └── Pipeline Stages (many — RESTRICT delete)
  └── Deals (many — RESTRICT delete)

Pipeline Stage
  └── Deals (many — RESTRICT delete)

Deal
  └── Pipeline (belongs to)
  └── Pipeline Stage (belongs to)
  └── Contact (belongs to — RESTRICT delete)
  └── Company (belongs to, optional)
  └── Lead (originated from, optional)
  └── Activities (many)
  └── Notes (many)

Activity
  └── Deal / Contact / Company / Lead (at least one required)

Note
  └── Deal / Contact / Company / Lead (at least one required)
```

---

## Conventions (all entities follow these)

| Convention | Rule |
|-----------|------|
| Primary key | UUID, `id`, defaultRandom() |
| Tenant scope | `organization_id` UUID FK — required on all entities except Organization |
| Timestamps | `created_at`, `updated_at` (TIMESTAMPTZ, auto-managed) |
| Soft delete | `deleted_at` TIMESTAMPTZ (NULL = active, non-null = deleted) |
| Created by | `created_by` UUID FK → users.id (except Organization and Note — Note uses `author_id`) |
| All FKs | UUID type, indexed |
| Enums | Defined as PostgreSQL ENUM types, not as varchar with CHECK |

---

## Migration Order

```
1. organizations
2. users
3. pipelines
4. pipeline_stages
5. companies
6. contacts
7. leads
8. deals
9. activities
10. notes
-- Post: ALTER TABLE leads ADD FK converted_deal_id → deals
```

---

## Notes

- The `activities` table covers both logged activities (done = true) and scheduled tasks (done = false).
- The `notes` table is cross-module — a note can be linked to any record type simultaneously.
- Never remove or rename a column without creating a migration and flagging the breaking change.
- `Organization` does not have an `organization_id` column — it is the tenant root.
