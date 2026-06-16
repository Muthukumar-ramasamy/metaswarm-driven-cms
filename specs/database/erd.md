# Entity Relationship Diagram

> **Agent**: Architect Agent
> **Phase**: 4 — Data Model Specification
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. Full ERD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TENANT ROOT                                        │
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │  organizations   │                                                       │
│  │──────────────────│                                                       │
│  │ id (PK)          │                                                       │
│  │ name             │                                                       │
│  │ slug (UNIQUE)    │                                                       │
│  │ created_at       │                                                       │
│  │ updated_at       │                                                       │
│  │ deleted_at       │                                                       │
│  └────────┬─────────┘                                                       │
│           │ 1                                                               │
│           │ has many                                                        │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
     ┌──────┴──────────────────────────────────────────────────────┐
     │                                                             │
     ▼                                                             ▼
┌──────────────┐                                         ┌──────────────────┐
│    users     │                                         │    pipelines     │
│──────────────│                                         │──────────────────│
│ id (PK)      │                                         │ id (PK)          │
│ org_id (FK)  │                                         │ org_id (FK)      │
│ email        │                                         │ name             │
│ name         │                                         │ is_default       │
│ password_hash│                                         │ display_order    │
│ role (ENUM)  │                                         │ created_by (FK)  │
│ is_active    │                                         └──────┬───────────┘
│ invite_token │                                                │ 1
│ invited_by   │◄──(self FK)                                    │ has many
└──────┬───────┘                                                ▼
       │ 1                                          ┌─────────────────────┐
       │ owns many                                  │   pipeline_stages   │
       │                                            │─────────────────────│
       ▼                                            │ id (PK)             │
  (owner_id FK on contacts,                         │ org_id (FK)         │
   companies, leads, deals,                         │ pipeline_id (FK)    │
   activities)                                      │ name                │
                                                    │ display_order       │
                                                    │ probability (0-100) │
                                                    └──────┬──────────────┘
                                                           │ 1
                                                           │ has many
                                                           ▼


┌──────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│    companies     │      │     contacts      │      │       leads         │
│──────────────────│      │───────────────────│      │─────────────────────│
│ id (PK)          │◄─────│ company_id (FK)   │      │ id (PK)             │
│ org_id (FK)      │      │ id (PK)           │◄─────│ contact_id (FK)     │
│ owner_id (FK)    │      │ org_id (FK)       │      │ org_id (FK)         │
│ name (UNIQUE/org)│      │ owner_id (FK)     │      │ owner_id (FK)       │
│ domain           │      │ first_name        │      │ company_id (FK) ────┤
│ industry         │      │ last_name         │      │ title               │
│ employee_count   │      │ email             │      │ value               │
│ annual_revenue   │      │ phone             │      │ status (ENUM)       │
│ country          │      │ job_title         │      │ source (ENUM)       │
│ city             │      │ source (ENUM)     │      │ expected_close_date │
│ website          │      └──────┬────────────┘      │ converted_deal_id   │──────┐
│ created_by (FK)  │             │                   │ converted_at        │      │
└──────┬───────────┘             │                   └──────┬──────────────┘      │
       │                         │                          │                     │
       │                         │                          │ converts to         │
       │                         │                          ▼                     │
       │                         │               ┌──────────────────────┐        │
       │                         └──────────────►│        deals         │◄───────┘
       │                                         │──────────────────────│
       └────────────────────────────────────────►│ id (PK)              │
                                                 │ org_id (FK)          │
                                                 │ pipeline_id (FK) ────┘──► pipelines
                                                 │ stage_id (FK)  ──────────► pipeline_stages
                                                 │ owner_id (FK)  ──────────► users
                                                 │ contact_id (FK)──────────► contacts
                                                 │ company_id (FK)──────────► companies
                                                 │ lead_id (FK)   ──────────► leads
                                                 │ title                │
                                                 │ value                │
                                                 │ status (ENUM)        │
                                                 │ lost_reason          │
                                                 │ expected_close_date  │
                                                 │ won_at               │
                                                 │ lost_at              │
                                                 │ created_by (FK)      │
                                                 └──────────┬───────────┘
                                                            │ 1
                                                            │ has many
                                          ┌─────────────────┴────────────────────┐
                                          ▼                                       ▼
                               ┌────────────────────┐              ┌─────────────────────┐
                               │     activities     │              │        notes         │
                               │────────────────────│              │─────────────────────│
                               │ id (PK)            │              │ id (PK)             │
                               │ org_id (FK)        │              │ org_id (FK)         │
                               │ owner_id (FK)      │              │ author_id (FK)      │
                               │ deal_id (FK)       │              │ deal_id (FK)        │
                               │ contact_id (FK)    │              │ contact_id (FK)     │
                               │ company_id (FK)    │              │ company_id (FK)     │
                               │ lead_id (FK)       │              │ lead_id (FK)        │
                               │ type (ENUM)        │              │ content (TEXT)      │
                               │ subject            │              │ is_pinned           │
                               │ note (TEXT)        │              └─────────────────────┘
                               │ outcome            │
                               │ done (BOOL)        │  ← false = task, true = logged
                               │ done_at            │
                               │ due_date           │
                               │ duration_minutes   │
                               └────────────────────┘
```

---

## 2. Relationship Summary

| From | To | Type | FK column | Rule |
|------|----|------|-----------|------|
| organizations | users | 1:N | users.organization_id | CASCADE delete |
| organizations | contacts | 1:N | contacts.organization_id | CASCADE delete |
| organizations | companies | 1:N | companies.organization_id | CASCADE delete |
| organizations | leads | 1:N | leads.organization_id | CASCADE delete |
| organizations | pipelines | 1:N | pipelines.organization_id | CASCADE delete |
| organizations | deals | 1:N | deals.organization_id | CASCADE delete |
| organizations | activities | 1:N | activities.organization_id | CASCADE delete |
| organizations | notes | 1:N | notes.organization_id | CASCADE delete |
| users | users | 1:N (self) | users.invited_by | SET NULL |
| users | contacts | 1:N (owns) | contacts.owner_id | RESTRICT |
| users | companies | 1:N (owns) | companies.owner_id | RESTRICT |
| users | leads | 1:N (owns) | leads.owner_id | RESTRICT |
| users | deals | 1:N (owns) | deals.owner_id | RESTRICT |
| users | activities | 1:N (owns) | activities.owner_id | RESTRICT |
| users | notes | 1:N (authored) | notes.author_id | RESTRICT |
| companies | contacts | 1:N | contacts.company_id | SET NULL |
| companies | leads | 1:N | leads.company_id | SET NULL |
| companies | deals | 1:N | deals.company_id | SET NULL |
| contacts | leads | 1:N | leads.contact_id | SET NULL |
| contacts | deals | 1:N | deals.contact_id | RESTRICT |
| pipelines | pipeline_stages | 1:N | pipeline_stages.pipeline_id | RESTRICT |
| pipelines | deals | 1:N | deals.pipeline_id | RESTRICT |
| pipeline_stages | deals | 1:N | deals.stage_id | RESTRICT |
| leads | deals | 1:1 (conversion) | leads.converted_deal_id | SET NULL |
| deals | activities | 1:N | activities.deal_id | SET NULL |
| deals | notes | 1:N | notes.deal_id | SET NULL |
| contacts | activities | 1:N | activities.contact_id | SET NULL |
| contacts | notes | 1:N | notes.contact_id | SET NULL |
| companies | activities | 1:N | activities.company_id | SET NULL |
| companies | notes | 1:N | notes.company_id | SET NULL |
| leads | activities | 1:N | activities.lead_id | SET NULL |
| leads | notes | 1:N | notes.lead_id | SET NULL |

---

## 3. Migration Order

Tables must be created in this order to satisfy FK dependencies:

```
1. organizations
2. users                  (depends on: organizations)
3. pipelines              (depends on: organizations, users)
4. pipeline_stages        (depends on: organizations, pipelines)
5. companies              (depends on: organizations, users)
6. contacts               (depends on: organizations, users, companies)
7. leads                  (depends on: organizations, users, contacts, companies)
8. deals                  (depends on: organizations, users, contacts, companies,
                                       pipelines, pipeline_stages, leads)
9. activities             (depends on: organizations, users, deals, contacts, companies, leads)
10. notes                 (depends on: organizations, users, deals, contacts, companies, leads)

-- Post-creation: add circular FK
ALTER TABLE leads ADD CONSTRAINT leads_converted_deal_id_fk
  FOREIGN KEY (converted_deal_id) REFERENCES deals(id) ON DELETE SET NULL;
```

---

## 4. Enums Summary

| Enum | Values |
|------|--------|
| `user_role` | admin, manager, sales_rep |
| `contact_source` | manual, import, web_form, api, lead_conversion |
| `lead_status` | new, contacted, qualified, disqualified, converted |
| `lead_source` | manual, import, web_form, api, referral, other |
| `deal_status` | open, won, lost |
| `activity_type` | call, email, meeting, demo, lunch, other |

---

## 5. Key Constraints Summary

| Table | Constraint | Type |
|-------|-----------|------|
| organizations | slug UNIQUE (global) | UNIQUE INDEX |
| users | (organization_id, email) UNIQUE where not deleted | PARTIAL UNIQUE INDEX |
| contacts | (organization_id, email) UNIQUE where email set and not deleted | PARTIAL UNIQUE INDEX |
| companies | (organization_id, name) UNIQUE where not deleted | PARTIAL UNIQUE INDEX |
| pipelines | one is_default per org where not deleted | PARTIAL UNIQUE INDEX |
| pipeline_stages | (pipeline_id, name) UNIQUE where not deleted | PARTIAL UNIQUE INDEX |
| pipeline_stages | (pipeline_id, display_order) UNIQUE where not deleted | PARTIAL UNIQUE INDEX |
| pipeline_stages | probability BETWEEN 0 AND 100 | CHECK |
| deals | lost_reason NOT NULL when status = 'lost' | CHECK |
| activities | at least one of deal_id/contact_id/company_id/lead_id NOT NULL | CHECK |
| notes | at least one of deal_id/contact_id/company_id/lead_id NOT NULL | CHECK |
