# DB Spec: Basic Reports

| Field | Value |
|-------|-------|
| Status | Approved |

---

## No New Entities

Basic Reports is a read-only module. It performs aggregation queries against existing tables:

| Query | Source tables |
|-------|--------------|
| Deals won/lost | `deals` (won_at, lost_at, value, owner_id) |
| Pipeline value by stage | `deals` JOIN `pipeline_stages` (status=open, value, stage_id) |
| Activity count by rep | `activities` (created_at, owner_id, type) JOIN `users` |
| Leads by source | `leads` (source, created_at, owner_id) |

No schema changes are required for this module.

---

## Query Patterns

### All report queries must include:
- `WHERE organization_id = $orgId` — tenant isolation
- `WHERE deleted_at IS NULL` — exclude soft-deleted records
- Sales Rep role override: `AND owner_id = $callerId` added by service layer

### Pipeline value by stage
```sql
SELECT ps.name, ps.display_order, SUM(d.value) as total_value, COUNT(d.id) as deal_count
FROM deals d
JOIN pipeline_stages ps ON ps.id = d.stage_id
WHERE d.organization_id = $orgId
  AND d.status = 'open'
  AND d.deleted_at IS NULL
  AND ps.deleted_at IS NULL
GROUP BY ps.id, ps.name, ps.display_order
ORDER BY ps.display_order ASC;
```

---

## Related Specs

| Spec | Path |
|------|------|
| Feature spec | `specs/features/basic-reports/feature-spec.md` |
| API spec | `specs/features/basic-reports/api-spec.md` |
