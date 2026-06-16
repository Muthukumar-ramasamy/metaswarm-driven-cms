# Metaswarm Knowledge Base — CRM SDD Project

## Current Pipeline State (as of 2026-06-16)

- All 8 feature specs: **Status: Approved** — implementation can proceed
- Backend/frontend code: **does not exist yet** — scaffold must be created first
- No `backend/` or `frontend/` directories exist in the repo

## Non-Negotiable Rules (all agents enforce)

1. **No code before Approved spec** — refuse any code generation if spec is not `Status: Approved`
2. **No hard deletes** — always `UPDATE ... SET deleted_at = NOW()`, never `DELETE FROM`
3. **Org-scoped queries** — every query must include `WHERE organization_id = $orgId` AND `WHERE deleted_at IS NULL`
4. **UUID PKs/FKs** — never use auto-increment integers
5. **org_id from JWT only** — never accept `organization_id` from request body or URL params
6. **Standard response envelope** — success: `{ data }` or `{ data, pagination }`; error: `{ error, message, details }`
7. **Role-restricted UI elements are hidden** — never just `disabled`
8. **No layer skipping** — routes never call repositories directly; always routes → controller → service → repository

## SDD Pipeline (strict order)

```
specs/features/{feature}/feature-spec.md  Status: Approved  ← all 8 are here
specs/features/{feature}/db-spec.md       Status: Approved
specs/features/{feature}/api-spec.md      Status: Approved
specs/features/{feature}/ui-spec.md       Status: Draft (not a blocker for backend)
specs/features/{feature}/test-spec.md     Status: Draft (not a blocker for implementation)
```

Implementation order: AuthUserManagement → ContactManagement → CompanyManagement →
LeadManagement → DealPipelineManagement → ActivityTaskTracking → Notes → BasicReports

## Architecture Reference Docs (agents must read these)

| File | Purpose |
|------|---------|
| `specs/architecture/backend.md` | 4-layer pattern, folder structure, code examples, env vars |
| `specs/architecture/security.md` | JWT flow, RBAC roles, tenant isolation rules |
| `specs/architecture/frontend.md` | React conventions, TanStack Query patterns |
| `specs/architecture/system-context.md` | System boundaries |
| `specs/database/schema.md` | Entity registry — check before adding fields |
| `specs/api/openapi.yaml` | API contract (38 endpoints) — never contradict this |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify v4, TypeScript 5.x, Node.js 20 LTS |
| ORM | Drizzle ORM + @neondatabase/serverless |
| Validation | Zod v3 |
| Auth | jsonwebtoken v9 (bcrypt v5, 12 rounds) |
| Email | nodemailer v6 |
| Frontend | React 18, Vite, TanStack Query v5, React Hook Form, Zod, MUI v5, Emotion |
| Tests | Vitest (unit + integration), Playwright (E2E) |
| Database | Neon PostgreSQL serverless |

## 4-Layer Backend Architecture

```
routes.ts        → registers endpoints, applies Zod schemas, calls controller
controller.ts    → extracts validated req data, calls service, builds HTTP response
service.ts       → business logic + business rules, calls repositories, throws AppError
repository.ts    → all SQL via Drizzle ORM, always scoped by organizationId
```

### routes.ts pattern
```ts
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

### controller.ts pattern
```ts
import { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './contacts.service'
import { ok, paginated } from '../../lib/response'

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { organizationId, userId, role } = req.user
  const result = await service.listContacts({ organizationId, userId, role, query: req.query })
  return reply.send(paginated(result))
}
```

### service.ts pattern
```ts
export async function listContacts({ organizationId, userId, role, query }) {
  const ownerId = role === 'sales_rep' ? userId : undefined
  return contactsRepository.findMany({ organizationId, ownerId, ...query })
}
```

### repository.ts pattern — ALWAYS include organizationId AND isNull(deletedAt)
```ts
export async function findMany({ organizationId, ownerId, page, limit, search }) {
  return db.select().from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),  // tenant isolation — mandatory
      isNull(contacts.deletedAt),                    // soft delete — mandatory
      ownerId ? eq(contacts.ownerId, ownerId) : undefined,
      search ? ilike(contacts.firstName, `%${search}%`) : undefined,
    ))
    .limit(limit).offset((page - 1) * limit)
}
```

## Drizzle Table Convention

```ts
export const contacts = pgTable('contacts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  ownerId:        uuid('owner_id').notNull().references(() => users.id),
  // ... fields ...
  createdBy:      uuid('created_by').notNull().references(() => users.id),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),    // soft delete — every table
}, (table) => ({
  orgIdx:   index('contacts_org_idx').on(table.organizationId),       // always index org_id
  ownerIdx: index('contacts_owner_idx').on(table.ownerId),
}))
```

Rules: every table has `organization_id` (indexed) + `deleted_at` (soft delete) + UUID PK.

## JWT Payload Structure

```ts
interface JWTPayload {
  sub: string            // userId (UUID)
  organizationId: string // tenant scope — read from here in middleware
  role: 'admin' | 'manager' | 'sales_rep'
  iat: number
  exp: number            // 24h TTL
}
// Attached to req.user by authenticate middleware
```

## RBAC — Two Enforcement Points

**Route-level (coarse):** `authorize('admin')` middleware blocks entire routes.
**Service-level (fine):** record ownership checks — sales_rep can only edit own records.

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| Read any record | ✅ | ✅ | Own only |
| Create any record | ✅ | ✅ | ✅ |
| Update any record | ✅ | ✅ | Own only |
| Soft-delete record | ✅ | ❌ | ❌ |
| Manage users/settings | ✅ | ❌ | ❌ |

## Error Handling

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
throw new AppError('DUPLICATE_EMAIL', 'Email already exists.', 409)
```

Global Fastify error handler in `app.ts` catches all `AppError` instances and returns:
```json
{ "error": "CONTACT_NOT_FOUND", "message": "Contact not found.", "details": [] }
```

## List Endpoint Standard Query Params

Every `GET /api/{resource}` must support:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | integer | 1 | |
| `limit` | integer | 20 | max 100 |
| `sort` | string | `created_at` | |
| `order` | `asc`\|`desc` | `desc` | |
| `search` | string | — | searches name/title fields |
| `ownerId` | UUID | — | manager/admin only |

## Backend Environment Variables

```
DATABASE_URL      required  Neon PostgreSQL connection string
JWT_SECRET        required  min 32 chars, never committed
JWT_EXPIRES_IN    optional  default: 24h
PORT              optional  default: 3000
SMTP_HOST         required
SMTP_PORT         required
SMTP_USER         required
SMTP_PASS         required
SMTP_FROM         required
FRONTEND_URL      required  used in invite/reset email links
NODE_ENV          optional  development | production
```

## Public Endpoints (no JWT required)

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/accept-invite
```
All other endpoints require `Authorization: Bearer <token>`.

## Security — What Must Never Happen

- No `DELETE FROM` — always soft delete via `deleted_at`
- No query without `organization_id` scope
- No query without `deleted_at IS NULL` on SELECT
- No `organization_id` from `req.body` or `req.params`
- No wildcard CORS in production
- No plaintext password storage or logging

## Rate Limiting (auth endpoints only)

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/login | 10 req | 15 min |
| POST /api/auth/forgot-password | 5 req | 15 min |
| POST /api/auth/reset-password | 5 req | 15 min |

## Metaswarm Review Configuration

- **External adversarial review**: Codex (OpenAI) — needs `OPENAI_API_KEY` + `codex` CLI
- **CI**: None — local checks only
- **Coverage threshold**: Not enforced

## MCP / Environment

- `NEON_API_KEY` env var → `@neondatabase/mcp-server-neon` MCP server (schema inspection)
- `DATABASE_URL` in `backend/.env` → Drizzle ORM app queries + migrations (separate from MCP key)
