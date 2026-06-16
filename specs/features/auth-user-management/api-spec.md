# API Spec: Auth & User Management — Phase 1

| Field | Value |
|-------|-------|
| Status | Approved |
| Phase | Phase 1: Signup, Login, Logout |
| Last updated | 2026-06-16 |

> **Scope**: Only 3 endpoints are in scope for Phase 1. All other auth and user-management endpoints are deferred to Phase 2.

---

## Endpoints (Phase 1)

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | /api/auth/signup | Create org + admin user, return JWT | No | Any |
| POST | /api/auth/login | Authenticate, return JWT | No | Any |
| POST | /api/auth/logout | Clear session (client-side JWT discard) | Yes | Any |

---

## Request / Response Shapes

### POST /api/auth/signup

**Request:**
```json
{
  "orgName": "Acme Corp",
  "firstName": "Sam",
  "email": "sam@acme.com",
  "password": "secretPassword123"
}
```

**Response 201:**
```json
{
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "role": "admin",
      "firstName": "Sam"
    }
  }
}
```

**Error 409:**
```json
{ "error": "CONFLICT", "message": "A user with this email already exists." }
```

**Error 400 (Zod validation):**
```json
{ "error": "VALIDATION_ERROR", "message": "Request validation failed.", "details": [...] }
```

---

### POST /api/auth/login

**Request:**
```json
{
  "email": "sam@acme.com",
  "password": "secretPassword123"
}
```

**Response 200:**
```json
{
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "firstName": "Sam",
      "role": "admin",
      "organizationId": "uuid"
    }
  }
}
```

**Error 401 (wrong password or unknown email):**
```json
{ "error": "UNAUTHORIZED", "message": "Invalid email or password." }
```

**Error 403 (deactivated account):**
```json
{ "error": "FORBIDDEN", "message": "Your account has been deactivated. Contact your admin." }
```

---

### POST /api/auth/logout

**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response 204:** No body.

**Error 401 (missing or invalid token):**
```json
{ "error": "UNAUTHORIZED", "message": "Missing or invalid token." }
```

---

## Error Codes (Phase 1)

| Scenario | HTTP | Error code |
|----------|------|------------|
| Duplicate email on signup | 409 | CONFLICT |
| Wrong credentials on login | 401 | UNAUTHORIZED |
| Email not found on login | 401 | UNAUTHORIZED (same as wrong password — no enumeration) |
| Deactivated user logs in | 403 | FORBIDDEN |
| Pending user logs in | 401 | UNAUTHORIZED |
| Missing/invalid JWT on logout | 401 | UNAUTHORIZED |
| Zod schema validation failure | 400 | VALIDATION_ERROR |
| Internal server error | 500 | INTERNAL_ERROR |

---

## Validation Rules

| Field | Rule |
|-------|------|
| orgName | Required, min 1 char |
| firstName | Required, min 1 char |
| email | Required, valid email format |
| password (signup) | Required, min 8 characters |
| email (login) | Required, valid email format |
| password (login) | Required, min 1 char |

---

## Security Notes

- JWT payload: `{ sub: userId, organizationId, role, iat, exp }`
- JWT TTL: 24 hours (ADR-003)
- `password_hash` must never appear in any response
- Logout is stateless — the JWT is not blocklisted server-side; the client discards it
- Logout requires a valid JWT (prevents unauthenticated logout calls)
- `organization_id` must never be accepted from request body — JWT only

---

## Deferred to Phase 2

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Set new password via token |
| POST | /api/auth/accept-invite | Accept invite + set password |
| GET | /api/auth/me | Get current user profile |
| GET | /api/users | List users in org |
| POST | /api/users/invite | Invite team member |
| POST | /api/users/:id/resend-invite | Resend invite |
| PUT | /api/users/:id | Update role or status |
| DELETE | /api/users/:id | Deactivate user (soft) |
