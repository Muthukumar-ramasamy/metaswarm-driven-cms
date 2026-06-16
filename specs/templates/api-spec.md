# API Spec: {FeatureName}

> This template defines the API contract for one feature module.
> The full consolidated spec lives in `specs/api/openapi.yaml`.
> Copy the endpoint blocks below into openapi.yaml when approved.

---

## Resource: {Resource}

Base path: `/api/{resource}`

---

### GET /api/{resource}

**Purpose**: List all {resources} (paginated, filterable)

**Auth**: Bearer JWT required

**Query parameters**:

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max 100) |
| sort | string | No | createdAt | Field to sort by |
| order | string | No | desc | asc or desc |
| search | string | No | — | Full-text search on name/email |
| status | string | No | — | Filter by status enum |
| assignedTo | uuid | No | — | Filter by assigned user |

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "...fields": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

**Response 401**: Unauthorized
**Response 403**: Forbidden (insufficient role)

---

### POST /api/{resource}

**Purpose**: Create a new {resource}

**Auth**: Bearer JWT required

**Request body**:
```json
{
  "field1": "string (required)",
  "field2": "string (optional)",
  "assignedTo": "uuid (optional)"
}
```

**Validation rules**:
- `field1`: required, min 2 chars, max 100 chars
- `email`: must be valid email format, unique per organization

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "...allFields": "...",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Response 400**: Validation error
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

**Response 409**: Conflict (duplicate)

---

### GET /api/{resource}/:id

**Purpose**: Get a single {resource} by ID

**Auth**: Bearer JWT required

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "...allFields": "...",
    "relatedEntity": { "...": "..." },
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Response 404**: Not found

---

### PUT /api/{resource}/:id

**Purpose**: Update a {resource} (full or partial)

**Auth**: Bearer JWT required

**Request body**: Same as POST, all fields optional

**Response 200**: Updated resource (same shape as GET /:id)

**Response 400**: Validation error
**Response 403**: Forbidden (not owner or insufficient role)
**Response 404**: Not found

---

### DELETE /api/{resource}/:id

**Purpose**: Soft-delete a {resource}

**Auth**: Bearer JWT required — Admin only

**Response 204**: No content

**Response 403**: Forbidden
**Response 404**: Not found

---

## Error Response Schema (all endpoints)

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "details": []
}
```

| Error code | HTTP status | When |
|-----------|-------------|------|
| VALIDATION_ERROR | 400 | Invalid request body |
| UNAUTHORIZED | 401 | Missing or invalid JWT |
| FORBIDDEN | 403 | Valid JWT but insufficient permissions |
| NOT_FOUND | 404 | Resource ID does not exist |
| CONFLICT | 409 | Duplicate unique field |
| INTERNAL_ERROR | 500 | Unexpected server error |
