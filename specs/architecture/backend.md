# Architecture Spec: Backend

> **Agent**: Architect Agent
> **Phase**: 3 — Architecture Specification
> **Input**: specs/product/prd.md, specs/architecture/system-context.md
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. Stack

| Layer | Library | Version |
|-------|---------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Fastify | v4 |
| Language | TypeScript | 5.x |
| ORM | Drizzle ORM | latest |
| DB driver | @neondatabase/serverless | latest |
| Validation | Zod | v3 |
| Auth | jsonwebtoken | v9 |
| Password hashing | bcrypt | v5 |
| Email | nodemailer | v6 |
| Environment | dotenv + zod (validated config) | — |

---

## 2. Layered Architecture

Every module follows a strict four-layer pattern. No layer may skip a layer — a route handler never calls the repository directly.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────┐
│  Route Handler  (routes.ts)         │  Registers endpoints, applies schemas
│  — no business logic                │  Calls controller functions
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Controller  (controller.ts)        │  Extracts validated request data
│  — no business logic                │  Calls service, builds HTTP response
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Service  (service.ts)              │  Business logic, business rules
│  — no HTTP, no SQL                  │  Calls repositories, throws domain errors
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Repository  (repository.ts)        │  All SQL via Drizzle ORM
│  — no business logic                │  ALWAYS includes WHERE organization_id = ?
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Database  (Neon PostgreSQL)        │
└─────────────────────────────────────┘
```

---

## 3. Folder Structure

```
backend/
├── src/
│   ├── index.ts                     # Server start — bind port, listen
│   ├── app.ts                       # Fastify factory — plugins, routes, error handler
│   │
│   ├── config/
│   │   └── env.ts                   # Zod-validated env vars (throws on missing)
│   │
│   ├── db/
│   │   ├── index.ts                 # Drizzle client (neon connection)
│   │   └── schema/
│   │       ├── users.ts             # Drizzle table definition for users
│   │       ├── organizations.ts
│   │       ├── contacts.ts
│   │       ├── companies.ts
│   │       ├── leads.ts
│   │       ├── pipelines.ts
│   │       ├── pipeline-stages.ts
│   │       ├── deals.ts
│   │       ├── activities.ts
│   │       └── notes.ts
│   │
│   ├── modules/                     # One folder per CRM module
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schemas.ts      # Zod request/response schemas
│   │   ├── contacts/
│   │   │   ├── contacts.routes.ts
│   │   │   ├── contacts.controller.ts
│   │   │   ├── contacts.service.ts
│   │   │   ├── contacts.repository.ts
│   │   │   └── contacts.schemas.ts
│   │   ├── companies/
│   │   │   └── ...                  # Same 5-file pattern
│   │   ├── leads/
│   │   │   └── ...
│   │   ├── deals/
│   │   │   └── ...
│   │   ├── activities/
│   │   │   └── ...
│   │   ├── notes/
│   │   │   └── ...
│   │   └── reports/
│   │       ├── reports.routes.ts
│   │       ├── reports.controller.ts
│   │       └── reports.service.ts   # No repository — uses read-only SQL aggregations
│   │
│   ├── middleware/
│   │   ├── authenticate.ts          # Verifies JWT, attaches user context to request
│   │   ├── authorize.ts             # Role-based access check factory
│   │   └── rate-limit.ts            # Rate limiting for auth endpoints
│   │
│   └── lib/
│       ├── jwt.ts                   # signToken(), verifyToken()
│       ├── password.ts              # hashPassword(), verifyPassword()
│       ├── mailer.ts                # sendInviteEmail(), sendPasswordResetEmail()
│       ├── response.ts              # ok(), paginated(), error() envelope builders
│       └── errors.ts                # AppError class with status code + error code
│
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Module File Pattern

Every module has the same 5 files: routes, controller, service, repository, schemas.

The `auth` module follows the same 5-file pattern. Its repository owns the `organizations` and `users` DB queries (`createOrganization`, `createUser`, `findUserByEmailGlobal`). The service holds all business rules (duplicate-email check, deactivated-user guard, password verify) and calls the repository.

### routes.ts
```ts
// contacts.routes.ts
import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import * as controller from './contacts.controller'

export async function contactRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  app.get('/',    controller.list)
  app.post('/',   controller.create)
  app.get('/:id', controller.getById)
  app.put('/:id', controller.update)
  app.delete('/:id', controller.remove)
}
```

### controller.ts
```ts
// contacts.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './contacts.service'
import { ok, paginated } from '../../lib/response'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { organizationId, userId, role } = req.user
  const result = await service.listContacts({ organizationId, userId, role, query: req.query })
  return reply.send(paginated(result))
}
```

### service.ts
```ts
// contacts.service.ts — business rules live here
export async function listContacts({ organizationId, userId, role, query }) {
  const ownerId = role === 'sales_rep' ? userId : undefined  // BR-2.3
  return contactsRepository.findMany({ organizationId, ownerId, ...query })
}
```

### repository.ts
```ts
// contacts.repository.ts — ALL queries include organization_id
export async function findMany({ organizationId, ownerId, page, limit, search }) {
  return db.select().from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),   // tenant isolation — always
      isNull(contacts.deletedAt),                     // soft delete — always
      ownerId ? eq(contacts.ownerId, ownerId) : undefined,
      search ? ilike(contacts.firstName, `%${search}%`) : undefined,
    ))
    .limit(limit).offset((page - 1) * limit)
}
```

### schemas.ts
```ts
// contacts.schemas.ts — Zod schemas used for both validation and TypeScript types
export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email().optional(),
  phone:     z.string().optional(),
  companyId: z.string().uuid().optional(),
})
```

---

## 5. Request Lifecycle

```
1. Request arrives at Fastify
2. authenticate hook runs:
   - Reads Authorization: Bearer <token>
   - Verifies JWT signature
   - Decodes { userId, organizationId, role }
   - Attaches to req.user
   - Returns 401 if missing or invalid
3. (Optional) authorize hook runs:
   - Checks req.user.role against allowed roles
   - Returns 403 if insufficient
4. Fastify validates request body/params/query via Zod schema
   - Returns 400 with validation errors if invalid
5. Controller called → delegates to service
6. Service runs business logic → may throw AppError
7. Repository executes SQL (always scoped by organizationId)
8. Controller calls response envelope builder
9. Response sent
10. Global error handler catches any uncaught AppError:
    - Maps to correct HTTP status code
    - Returns { error: 'ERROR_CODE', message: '...', details: [] }
```

---

## 6. Response Envelope

All responses use a consistent envelope. Defined in `src/lib/response.ts`.

**Single record:**
```json
{ "data": { "id": "...", "firstName": "Alice", ... } }
```

**List / paginated:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "error": "CONTACT_NOT_FOUND",
  "message": "No contact found with that ID in your organisation.",
  "details": []
}
```

---

## 7. Error Handling

All domain errors are thrown as `AppError` instances from the service layer:

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details: unknown[] = [],
  ) { super(message) }
}

// Usage in service:
throw new AppError('CONTACT_NOT_FOUND', 'Contact not found.', 404)
throw new AppError('DUPLICATE_EMAIL', 'A contact with this email already exists.', 409)
```

Fastify's global error handler (in `app.ts`) catches every `AppError` and returns the standard error envelope. Unexpected errors (not `AppError`) return a generic 500.

---

## 8. List Endpoint Conventions

Every `GET /api/{resource}` endpoint must support these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Records per page (max 100) |
| `sort` | string | `created_at` | Column to sort by |
| `order` | `asc` \| `desc` | `desc` | Sort direction |
| `search` | string | — | Searches name/title fields |
| `ownerId` | UUID | — | Filter by owner (manager/admin only) |

---

## 9. Environment Variables

Validated at startup by `src/config/env.ts` using Zod. The server refuses to start if any required variable is missing.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token TTL (default: `24h`) |
| `PORT` | No | Server port (default: `3000`) |
| `SMTP_HOST` | Yes | SMTP host for emails |
| `SMTP_PORT` | Yes | SMTP port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | From address for emails |
| `FRONTEND_URL` | Yes | Used in invite/reset email links |
| `NODE_ENV` | No | `development` \| `production` |

---

## 10. Database Conventions

All Drizzle schema files follow this pattern:

```ts
// db/schema/contacts.ts
export const contacts = pgTable('contacts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  ownerId:        uuid('owner_id').notNull().references(() => users.id),
  firstName:      varchar('first_name', { length: 255 }).notNull(),
  lastName:       varchar('last_name',  { length: 255 }).notNull(),
  email:          varchar('email', { length: 255 }),
  // ...
  createdBy:      uuid('created_by').notNull().references(() => users.id),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  orgIdx:   index('contacts_org_idx').on(table.organizationId),
  ownerIdx: index('contacts_owner_idx').on(table.ownerId),
  emailIdx: index('contacts_email_idx').on(table.organizationId, table.email),
}))
```

Rules:
- Every table has `organization_id` (indexed)
- Every table has `deleted_at` (soft delete)
- All FK columns are indexed
- `updated_at` is maintained via a Drizzle `$onUpdate` hook
