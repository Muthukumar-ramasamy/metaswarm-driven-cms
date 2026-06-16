# DB Spec: Lead Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full entity spec: `specs/database/entities/lead.md`

---

## Entity: Lead → `leads`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK |
| organization_id | UUID | Yes | FK → organizations.id |
| title | VARCHAR(255) | Yes | |
| value | DECIMAL(12,2) | No | Default 0 |
| status | ENUM | Yes | new, contacted, qualified, disqualified, converted |
| source | ENUM | No | lead_source enum |
| owner_id | UUID | Yes | FK → users.id |
| contact_id | UUID | No | FK → contacts.id, SET NULL |
| company_id | UUID | No | FK → companies.id, SET NULL |
| converted_at | TIMESTAMPTZ | No | Set on conversion |
| converted_deal_id | UUID | No | FK → deals.id (added via ALTER TABLE after deals table) |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| deleted_at | TIMESTAMPTZ | No | Soft delete |

---

## Relationships

| From | To | FK | On delete |
|------|----|----|-----------|
| Lead | Organization | organization_id | CASCADE |
| Lead | User (owner) | owner_id | RESTRICT |
| Lead | Contact | contact_id | SET NULL |
| Lead | Company | company_id | SET NULL |
| Lead | Deal (converted) | converted_deal_id | SET NULL (added via ALTER TABLE after deals table exists) |

---

## Migration Order

1. `create_leads` (without converted_deal_id)
2. `create_deals` (in deal-pipeline-management migration)
3. `alter_leads_add_converted_deal_id` (after deals table exists)

---

## Critical Constraints

- Converted leads must not be deleted (service-layer guard)
- `converted_at IS NOT NULL` implies `status = 'converted'`

---

## Related Specs

| Spec | Path |
|------|------|
| Entity spec | `specs/database/entities/lead.md` |
| Feature spec | `specs/features/lead-management/feature-spec.md` |
