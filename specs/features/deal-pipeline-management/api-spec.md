# API Spec: Deal & Pipeline Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/deals | List deals (filter by status/owner/stage) | Yes | All |
| POST | /api/deals | Create deal | Yes | All |
| GET | /api/deals/:id | Get deal detail (with stage history) | Yes | All |
| PUT | /api/deals/:id | Update deal | Yes | All (own) / Manager / Admin |
| DELETE | /api/deals/:id | Soft-delete deal | Yes | Admin |
| POST | /api/deals/:id/won | Mark deal as won | Yes | All (own) |
| POST | /api/deals/:id/lost | Mark deal as lost + reason | Yes | All (own) |
| GET | /api/pipeline-stages | List pipeline stages for org | Yes | All |
| POST | /api/pipeline-stages | Create stage | Yes | Admin |
| PUT | /api/pipeline-stages/:id | Update stage name/probability | Yes | Admin |
| DELETE | /api/pipeline-stages/:id | Delete stage (blocked if open deals) | Yes | Admin |
| PUT | /api/pipeline-stages/reorder | Reorder stages | Yes | Admin |

---

## Query Parameters — GET /api/deals

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Records per page (max 100) |
| sort | string | `created_at` | Column to sort by (`created_at`, `title`, `value`, `expected_close_date`) |
| order | `asc` \| `desc` | `desc` | Sort direction |
| search | string | — | Case-insensitive match on deal title |
| status | string | `open` | Comma-separated status filter (`open`, `won`, `lost`) |
| ownerId | uuid | — | Filter by owner (admin/manager only; sales rep always sees own) |
| stageId | uuid | — | Filter by pipeline stage |

Response: `200 { "data": [ Deal ], "pagination": { page, limit, total, totalPages } }`

---

## Key Shapes

### POST /api/deals
```json
Request:  { "title": "string (required)", "stageId": "uuid (required)", "value": 0, "ownerId": "uuid", "contactId": "uuid", "companyId": "uuid", "expectedCloseDate": "YYYY-MM-DD" }
Response: 201 { "data": { Deal } }
```

### GET /api/deals/:id
```json
Response: 200 { "data": { Deal, stageHistory: [ DealStageHistory ] } }
```

### PUT /api/deals/:id
```json
Request:  { "title": "string", "value": 0, "stageId": "uuid", "ownerId": "uuid", "expectedCloseDate": "YYYY-MM-DD" }
Response: 200 { "data": { Deal } }
```

### POST /api/deals/:id/won
```json
Request:  {}
Response: 200 { "data": { Deal with status=won, wonAt } }
```

### POST /api/deals/:id/lost
```json
Request:  { "lostReason": "string (required)" }
Response: 200 { "data": { Deal with status=lost, lostAt, lostReason } }
```

### PUT /api/pipeline-stages/reorder
```json
Request:  { "stages": [ { "id": "uuid", "displayOrder": 1 }, ... ] }
Response: 200 { "data": [ { PipelineStage } ] }
```

---

### GET /api/pipeline-stages
```json
Response: 200 { "data": [ PipelineStage ] }
```

### PUT /api/pipeline-stages/reorder
```json
Request:  { "stages": [ { "id": "uuid", "displayOrder": 1 }, ... ] }
Response: 200 { "data": [ { PipelineStage } ] }
```

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Create deal without stage | 400 | VALIDATION_ERROR |
| Mark lost without reason | 400 | VALIDATION_ERROR |
| Sales Rep edits another's deal | 403 | FORBIDDEN |
| Non-admin deletes deal | 403 | FORBIDDEN |
| Deal not found | 404 | NOT_FOUND |
| Delete stage with open deals | 422 | UNPROCESSABLE |
| Delete last stage | 422 | UNPROCESSABLE |
