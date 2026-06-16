# API Spec: Basic Reports

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints (all GET, read-only)

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/reports/deals | Deals won/lost summary | Yes | All |
| GET | /api/reports/pipeline-value | Open deal value by stage | Yes | All |
| GET | /api/reports/activities | Activity count by rep | Yes | All |
| GET | /api/reports/leads-by-source | Lead count by source | Yes | All |

---

## Common Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| startDate | ISO8601 date | 30 days ago | Inclusive |
| endDate | ISO8601 date | today | Inclusive |
| ownerId | uuid | — | Manager/Admin only; Sales Rep sees own only |

---

## Response Shapes

### GET /api/reports/deals
```json
{
  "data": {
    "won": { "count": 12, "totalValue": 145000 },
    "lost": { "count": 4, "totalValue": 23000 },
    "dateRange": { "startDate": "2026-05-13", "endDate": "2026-06-13" }
  }
}
```

### GET /api/reports/pipeline-value
```json
{
  "data": {
    "stages": [
      { "stageId": "uuid", "stageName": "Lead In", "dealCount": 8, "totalValue": 56000 },
      { "stageId": "uuid", "stageName": "Demo Scheduled", "dealCount": 3, "totalValue": 22000 }
    ],
    "grandTotal": 78000
  }
}
```

### GET /api/reports/activities
```json
{
  "data": {
    "reps": [
      { "userId": "uuid", "name": "Sam Lee", "call": 5, "email": 12, "meeting": 3, "demo": 1, "lunch": 0, "other": 2, "total": 23 }
    ],
    "dateRange": { "startDate": "...", "endDate": "..." }
  }
}
```

### GET /api/reports/leads-by-source
```json
{
  "data": {
    "sources": [
      { "source": "website", "count": 12 },
      { "source": "referral", "count": 7 }
    ],
    "dateRange": { "startDate": "...", "endDate": "..." }
  }
}
```

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Invalid date format in startDate/endDate | 400 | VALIDATION_ERROR |
| startDate is after endDate | 400 | VALIDATION_ERROR |
| ownerId references a user outside the org | 404 | NOT_FOUND |

## Security Notes

- Sales Rep role: `ownerId` query param silently overridden to `callerId` — never a 403
- All data is org-scoped via JWT
