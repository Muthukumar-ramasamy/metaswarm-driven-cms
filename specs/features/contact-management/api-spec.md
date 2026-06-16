# API Spec: Contact Management

| Field | Value |
|-------|-------|
| Status | Approved |

Full OpenAPI definition: `specs/api/openapi.yaml`

---

## Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /api/contacts | List contacts (paginated, searchable) | Yes | All |
| POST | /api/contacts | Create contact | Yes | All |
| GET | /api/contacts/:id | Get contact detail | Yes | All |
| PUT | /api/contacts/:id | Update contact | Yes | All (own) / Manager / Admin |
| DELETE | /api/contacts/:id | Soft-delete contact | Yes | Admin only |

---

## Key Request / Response Shapes

### GET /api/contacts (query params)
```
page, limit, sort, order, search (name/email), ownerId (Manager/Admin only)
```
Service automatically overrides `ownerId` to caller's ID for sales_rep role.

### POST /api/contacts
```json
Request:  {
  "firstName": "string (required)",
  "lastName": "string",
  "email": "string (email format)",
  "phone": "string",
  "jobTitle": "string",
  "companyId": "uuid",
  "source": "enum: contact_source"
}
Response: 201 { "data": { Contact } }
```

### GET /api/contacts/:id
```json
Response: {
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "jobTitle": "string | null",
    "source": "contact_source | null",
    "notes": "string | null",
    "company": { "id": "uuid", "name": "string" } | null,
    "owner": { "id": "uuid", "firstName": "string" },
    "deals": [],
    "activities": [],
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```
**Note:** `deals` and `activities` are always `[]` until Deal/Activity modules are implemented. The Notes relation is excluded from this endpoint.

### PUT /api/contacts/:id (reassign owner)
The same PUT endpoint handles owner reassignment. Include `ownerId` in the request body:
- Manager/Admin: `ownerId` change is allowed
- Sales Rep: including `ownerId` in the body returns 403 (even if changing to their own id)

---

## Error Codes

| Scenario | HTTP | Error code |
|----------|------|------------|
| Duplicate email in org | 409 | CONFLICT |
| Edit contact not owned (sales rep) | 403 | FORBIDDEN |
| Non-admin delete | 403 | FORBIDDEN |
| Contact not found OR wrong owner (sales rep) | 403 | FORBIDDEN (identical response — never 404, prevents IDOR) |

---

## Implementation Notes

| Rule | Detail |
|------|--------|
| `req.user.userId` | Use `req.user.userId` throughout controller and service — NOT `req.user.sub`. The JWT payload field is `sub`, but `authenticate.ts` maps it to `req.user.userId`. |
| Route prefix | `contacts.routes.ts` must use relative paths (`/contacts`, `/:id`) when registered with `app.register(contactsRoutes, { prefix: '/api' })`. Do NOT include `/api/` inside the routes file. |
| Search semantics | `search` query param is case-insensitive partial match on `first_name`, `last_name`, and `email` via SQL `ILIKE '%term%'`. |
| `ok()` usage | `ok(contact)` — not `ok({ data: contact })`. The `ok()` helper already wraps in `{ data: ... }`. Double-nesting produces `{ data: { data: ... } }`. |
| companies prerequisite | `backend/src/db/schema/companies.ts` stub must exist before contacts schema can reference it. Run `companies` table migration before `contacts` migration. |
