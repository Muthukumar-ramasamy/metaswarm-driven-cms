# API Spec: Activity & Task Tracking

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/activities | List activities/tasks (filter by done, owner, record) | Yes | All |
| POST | /api/activities | Create activity or task | Yes | All |
| GET | /api/activities/:id | Get activity detail | Yes | All |
| PUT | /api/activities/:id | Update activity | Yes | All (own) |
| DELETE | /api/activities/:id | Soft-delete activity | Yes | All (own) / Admin |
| PUT | /api/activities/:id/done | Mark task as done | Yes | Owner |

---

## Query Parameters — GET /api/activities

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Records per page (max 100) |
| sort | string | `created_at` | Column to sort by (`created_at`, `due_date`, `subject`) |
| order | `asc` \| `desc` | `desc` | Sort direction |
| search | string | — | Case-insensitive match on subject |
| done | boolean | — | Filter by done flag (`true` = logged activities, `false` = open tasks) |
| ownerId | uuid | — | Filter by owner (admin/manager only; sales rep always sees own) |
| dealId | uuid | — | Filter activities linked to a specific deal |
| contactId | uuid | — | Filter activities linked to a specific contact |
| companyId | uuid | — | Filter activities linked to a specific company |
| leadId | uuid | — | Filter activities linked to a specific lead |

Response: `200 { "data": [ Activity ], "pagination": { page, limit, total, totalPages } }`

---

## Key Shapes

### POST /api/activities
```json
Request:  { "type": "call|email|meeting|demo|lunch|other (required)", "subject": "string (required)", "done": false, "dueDate": "YYYY-MM-DD", "notes": "string", "dealId": "uuid", "contactId": "uuid", "companyId": "uuid", "leadId": "uuid" }
Response: 201 { "data": { Activity } }
```

### GET /api/activities/:id
```json
Response: 200 { "data": { Activity } }
```

### PUT /api/activities/:id
```json
Request:  { "subject": "string", "type": "enum", "notes": "string", "dueDate": "YYYY-MM-DD" }
Response: 200 { "data": { Activity } }
```

### GET /api/activities (My Tasks)
```
?done=false&ownerId={me}&sort=dueDate&order=asc
```
Used by the My Tasks page to load open tasks for the logged-in user.

### PUT /api/activities/:id/done
```json
Request:  { "notes": "string (optional outcome note)" }
Response: 200 { "data": { Activity with done=true, doneAt=now } }
```

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Create with no linked record | 400 | VALIDATION_ERROR |
| Invalid activity type | 400 | VALIDATION_ERROR |
| Mark already-done task done again | 400 | VALIDATION_ERROR |
| Edit another user's activity (sales rep) | 403 | FORBIDDEN |
| Activity not found | 404 | NOT_FOUND |
