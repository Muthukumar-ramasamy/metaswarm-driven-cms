# API Spec: Notes

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/notes | List notes (filter by deal/contact/company/lead ID) | Yes | All |
| POST | /api/notes | Create note | Yes | All |
| GET | /api/notes/:id | Get note by ID | Yes | All |
| PUT | /api/notes/:id | Update content or is_pinned | Yes | Author / Admin |
| DELETE | /api/notes/:id | Soft-delete note | Yes | Author / Admin |

---

## Key Shapes

### GET /api/notes (query params)
```
?dealId=uuid        — filter by deal (one of these is required)
?contactId=uuid     — filter by contact
?companyId=uuid     — filter by company
?leadId=uuid        — filter by lead
&page=1             — pagination page (default 1)
&limit=50           — page size (default 50, max 200)
&sort=created_at    — sort field: created_at | is_pinned (default created_at)
&order=desc         — sort order: asc | desc (default desc)
&search=string      — full-text search on content field
```
Response: 200 `{ "data": [Note, ...], "pagination": { page, limit, total, totalPages } }`

### POST /api/notes
```json
Request: {
  "content": "string (required)",
  "dealId": "uuid",
  "contactId": "uuid",
  "companyId": "uuid",
  "leadId": "uuid",
  "isPinned": false
}
Response: 201 { "data": { Note } }
```

### GET /api/notes/:id
```
Response: 200 { "data": { Note } }
```

### PUT /api/notes/:id
```json
Request: {
  "content": "string",
  "isPinned": true
}
Response: 200 { "data": { Note } }
```

### DELETE /api/notes/:id
```
Response: 200 { "data": { "id": "uuid" } }
```

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Create with no linked record | 400 | VALIDATION_ERROR |
| Empty content | 400 | VALIDATION_ERROR |
| Non-author, non-admin edit/delete | 403 | FORBIDDEN |
| Note not found | 404 | NOT_FOUND |
