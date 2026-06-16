# Architecture Spec: Security

> **Agent**: Architect Agent
> **Phase**: 3 — Architecture Specification
> **Input**: specs/product/prd.md, specs/architecture/system-context.md, specs/architecture/backend.md
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. Security Model Overview

Three independent enforcement layers, each responsible for a different concern:

| Layer | Concern | Where enforced |
|-------|---------|----------------|
| **Authentication** | Is this a real, logged-in user? | `authenticate` middleware (every request) |
| **Authorisation (RBAC)** | Is this user allowed to do this action? | `authorize` middleware + service layer |
| **Tenant isolation** | Is this user allowed to see this record? | Repository layer (`organization_id` on all queries) |

All three must pass for a request to succeed. Bypassing any one layer breaks the entire security model.

---

## 2. Authentication — JWT

### 2.1 Token flow

```
1. User POSTs /api/auth/login with { email, password }
2. Server verifies password with bcrypt.compare()
3. Server signs a JWT:
   payload: { sub: userId, organizationId, role, iat, exp }
   secret:  JWT_SECRET env var (min 32 chars, never committed)
   expiry:  24 hours (JWT_EXPIRES_IN env var)
4. JWT returned in response body: { data: { token, user } }
5. Frontend stores token in localStorage
6. All subsequent requests include:  Authorization: Bearer <token>
7. authenticate middleware on every protected route:
   - Reads header, extracts token
   - Calls jwt.verify(token, JWT_SECRET)
   - On success: attaches decoded payload to req.user
   - On failure: returns 401 { error: 'UNAUTHORIZED', message: 'Invalid or expired token.' }
```

### 2.2 JWT payload

```ts
interface JWTPayload {
  sub: string            // userId (UUID)
  organizationId: string // tenant scope
  role: 'admin' | 'manager' | 'sales_rep'
  iat: number            // issued at (Unix seconds)
  exp: number            // expires at (Unix seconds)
}
```

### 2.3 Token expiry

- Access token TTL: **24 hours** (single token, no refresh in MVP)
- On expiry the frontend receives 401 and is redirected to `/login`
- Post-MVP: replace with short-lived access token (15 min) + httpOnly refresh token (30 days)

### 2.4 Password hashing

- Algorithm: **bcrypt**, 12 rounds
- Passwords are **never stored in plaintext**, never logged, never returned in responses
- Password reset uses a signed time-limited token (JWT, 1-hour TTL) sent by email — not the auth token

### 2.5 Public endpoints (no JWT required)

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/signup` | No token exists yet |
| `POST /api/auth/login` | No token exists yet |
| `POST /api/auth/forgot-password` | User cannot authenticate |
| `POST /api/auth/reset-password` | Uses a reset token, not auth token |
| `POST /api/auth/accept-invite` | Uses an invite token, not auth token |

All other endpoints require a valid JWT.

---

## 3. Authorisation — RBAC

### 3.1 Role definitions

| Role | Value in JWT | Capabilities |
|------|-------------|-------------|
| Admin | `admin` | Full access to all records and all settings |
| Manager | `manager` | Read all records in the org; edit and reassign; no user/settings management |
| Sales Rep | `sales_rep` | Create and edit own records; read own records only |

### 3.2 Role enforcement — two places

**Place 1: Route-level (coarse-grained)** — the `authorize` middleware blocks entire routes for roles that should never reach them.

```ts
// Example: only admins can manage pipeline stages
app.delete('/api/pipeline-stages/:id',
  { onRequest: [authenticate, authorize('admin')] },
  controller.deleteStage
)
```

**Place 2: Service-level (fine-grained)** — the service layer enforces record-ownership rules.

```ts
// contacts.service.ts
async function updateContact(id, data, { userId, organizationId, role }) {
  const contact = await contactsRepository.findById(id, organizationId)
  if (!contact) throw new AppError('CONTACT_NOT_FOUND', 'Contact not found.', 404)

  // sales_rep can only edit their own contacts (BR-2.3)
  if (role === 'sales_rep' && contact.ownerId !== userId) {
    throw new AppError('FORBIDDEN', 'You can only edit contacts you own.', 403)
  }

  return contactsRepository.update(id, data)
}
```

### 3.3 Permission reference

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| Read any record | ✅ | ✅ | Own only |
| Create any record | ✅ | ✅ | ✅ |
| Update own record | ✅ | ✅ | ✅ |
| Update any record | ✅ | ✅ | ❌ |
| Soft-delete record | ✅ | ❌ | ❌ |
| Reassign owner | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Manage pipeline stages | ✅ | ❌ | ❌ |
| View all reports | ✅ | ✅ | Own only |
| Export data | ✅ | ✅ | ❌ |

---

## 4. Tenant Isolation — Multi-tenancy

### 4.1 Model

Row-level isolation: every table has an `organization_id` column. Every query in every repository is required to include `WHERE organization_id = :organizationId`.

The `organizationId` value is always read from `req.user.organizationId` (the verified JWT) — **never from the request body or query string**. A client cannot claim to belong to a different organisation.

### 4.2 Enforcement rule

This is a hard rule that the Architect Agent checks on every repository review:

> Every `SELECT`, `INSERT`, `UPDATE`, and logical-`DELETE` in a repository file must include a `WHERE organization_id = :organizationId` clause. No exceptions.

```ts
// CORRECT — organization_id always present
db.select().from(contacts)
  .where(and(
    eq(contacts.organizationId, organizationId),  // ← mandatory
    isNull(contacts.deletedAt),
  ))

// WRONG — missing tenant scope, NEVER allowed
db.select().from(contacts).where(eq(contacts.id, id))
```

### 4.3 Soft delete enforcement

`deleted_at IS NULL` must appear on every SELECT query. Records with a non-null `deleted_at` are logically deleted and must never be returned to the client.

```ts
// CORRECT
.where(and(
  eq(contacts.organizationId, organizationId),
  isNull(contacts.deletedAt),         // ← mandatory
))

// WRONG — returns soft-deleted records
.where(eq(contacts.organizationId, organizationId))
```

---

## 5. Input Validation

All input is validated by Zod at the route/controller boundary before it reaches the service. The validation covers:

- **Body**: POST / PUT request bodies validated against the module's `*.schemas.ts`
- **Params**: `:id` params validated as UUIDs
- **Query**: List query params validated for types and bounds (e.g. `limit` max = 100)

Zod validation errors are returned as:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data.",
  "details": [
    { "field": "email", "message": "Invalid email address." }
  ]
}
```

No unvalidated input ever reaches the service or repository.

---

## 6. CORS

CORS is configured in `app.ts` via `@fastify/cors`:

```ts
app.register(cors, {
  origin: process.env.FRONTEND_URL,   // only the known frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

Wildcards (`*`) are not permitted in production.

---

## 7. Rate Limiting

Rate limiting is applied to auth endpoints only (via `@fastify/rate-limit`):

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 10 requests | 15 minutes |
| `POST /api/auth/forgot-password` | 5 requests | 15 minutes |
| `POST /api/auth/reset-password` | 5 requests | 15 minutes |

All other endpoints are not rate-limited in MVP.

---

## 8. Secrets Management

| Secret | Storage |
|--------|---------|
| `JWT_SECRET` | Environment variable — never committed to git |
| `DATABASE_URL` | Environment variable — never committed to git |
| `SMTP_PASS` | Environment variable — never committed to git |

`.env` files are in `.gitignore`. A `.env.example` file (no real values) is committed for reference.

---

## 9. What is NOT in scope (MVP)

| Capability | Reason deferred |
|-----------|----------------|
| Refresh tokens / token rotation | Adds complexity; 24h TTL acceptable for MVP |
| httpOnly cookie token storage | Requires CSRF protection; localStorage simpler for MVP |
| Two-factor authentication | Post-MVP |
| SSO / OAuth | Post-MVP |
| Field-level encryption | No PII sensitivity requirement in MVP |
| Audit log | Post-MVP |
| IP allowlisting | Post-MVP |
| SQL injection protection (explicit) | Drizzle ORM uses parameterised queries by default |
| XSS protection | React escapes output by default; no dangerouslySetInnerHTML used |
