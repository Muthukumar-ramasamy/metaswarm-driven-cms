# API Spec: Lead Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/leads | List leads (paginated, filter by status/owner) | Yes | All |
| POST | /api/leads | Create lead | Yes | All |
| GET | /api/leads/:id | Get lead detail | Yes | All |
| PUT | /api/leads/:id | Update lead | Yes | All (own) / Manager / Admin |
| DELETE | /api/leads/:id | Soft-delete lead | Yes | Admin only |
| POST | /api/leads/:id/convert | Convert lead to deal | Yes | All (own) / Manager / Admin |

---

## Query Parameters — GET /api/leads

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Records per page (max 100) |
| sort | string | `created_at` | Column to sort by (`created_at`, `title`, `value`, `status`) |
| order | `asc` \| `desc` | `desc` | Sort direction |
| search | string | — | Case-insensitive match on lead title |
| status | string | `new,contacted` | Comma-separated status filter (default excludes disqualified/converted) |
| ownerId | uuid | — | Filter by owner (admin/manager only; sales rep always sees own) |

Response: `200 { "data": [ Lead ], "pagination": { page, limit, total, totalPages } }`

---

## Key Shapes

### POST /api/leads
```json
Request:  { "title": "string (required)", "value": 0, "source": "string", "contactId": "uuid", "companyId": "uuid" }
Response: 201 { "data": { Lead } }
```

### GET /api/leads/:id
```json
Response: 200 { "data": { Lead } }
```

### PUT /api/leads/:id
```json
Request:  { "title": "string", "value": 0, "status": "new|contacted|qualified|disqualified", "source": "string", "ownerId": "uuid" }
Response: 200 { "data": { Lead } }
```

### POST /api/leads/:id/convert
```json
Request:  { "stageId": "uuid (required)" }
Response: 200 {
  "data": {
    "lead": { "id": "uuid", "status": "converted", "convertedAt": "ISO8601" },
    "deal": { "id": "uuid", "title": "string", "stageId": "uuid" }
  }
}
```

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Convert already-converted lead | 422 | UNPROCESSABLE |
| Convert without stageId | 400 | VALIDATION_ERROR |
| Non-admin delete | 403 | FORBIDDEN |
| Lead not found | 404 | NOT_FOUND |
