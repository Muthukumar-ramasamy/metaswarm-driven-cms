# Implementation Plan v3: Auth & User Management — Phase 1 (Signup, Login, Logout)
<!-- status: draft -->
<!-- gate-iteration: 3 -->
<!-- spec-authority: specs/features/auth-user-management/ + specs/architecture/backend.md -->

## Overview

Greenfield backend for 3 auth endpoints: signup, login, logout. No frontend. 9-WU plan.

Module folder: `backend/src/modules/auth/` (per `specs/architecture/backend.md` lines 92-97).
File prefix: `auth.` (e.g., auth.routes.ts, auth.repository.ts).

Architecture note: The `auth` module follows the standard 5-file pattern including `auth.repository.ts`. The repository owns `createOrganization`, `createUser`, and `findUserByEmailGlobal`. The service holds all business rules. This was updated from the original architecture spec (which incorrectly listed auth as a 4-file exception) — the repository is necessary to support integration tests via the immutable vitest workspace glob `*.repository.test.ts`.

`vitest.workspace.ts` already exists and is immutable. WU-4 creates `backend/src/test/setup.ts` which the existing config references as `setupFiles`. No modification to `vitest.workspace.ts` is needed or allowed.

---

## File Map (all new — backend/ does not exist)

### Scaffold
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.env.example`
- `backend/drizzle.config.ts`

### DB
- `backend/src/db/schema/organizations.ts`
- `backend/src/db/schema/users.ts`
- `backend/src/db/index.ts`
- `backend/drizzle/0001_create_organizations.sql`
- `backend/drizzle/0002_create_users.sql`

### Config & Lib
- `backend/src/config/env.ts`
- `backend/src/lib/errors.ts`
- `backend/src/lib/response.ts`
- `backend/src/lib/jwt.ts`
- `backend/src/lib/password.ts`

### Middleware & Types (both created in WU-7)
- `backend/src/middleware/authenticate.ts`
- `backend/src/types/fastify.d.ts`

### Module: auth (5-file pattern)
- `backend/src/modules/auth/auth.schemas.ts`
- `backend/src/modules/auth/auth.repository.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.routes.ts`

### Test Infrastructure (created in WU-4)
- `backend/src/test/setup.ts`

### Tests (created in WU-9)
- `backend/src/modules/auth/__tests__/auth.service.test.ts` — matches vitest glob `*.service.test.ts`
- `backend/src/modules/auth/__tests__/auth.repository.test.ts` — matches vitest glob `*.repository.test.ts`

### App Wiring (created in WU-8)
- `backend/src/app.ts`
- `backend/src/index.ts`

Total: 27 files

---

## Work Units

### WU-1: Scaffold

**Depends on**: nothing

**Creates**: `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/drizzle.config.ts`

`package.json` deps: fastify ^4, drizzle-orm, @neondatabase/serverless, zod ^3, jsonwebtoken ^9, bcryptjs ^2, dotenv ^16
`package.json` devDeps: typescript ^5, @types/node, @types/jsonwebtoken, @types/bcryptjs, drizzle-kit, vitest, ts-node
`tsconfig.json`: strict: true, moduleResolution: bundler, target: ES2022, include: ["src/**/*", "src/types/**/*"]
`drizzle.config.ts`: out: "./drizzle", schema: "./src/db/schema"
`.env.example`: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV, SMTP_* (optional Phase 2), FRONTEND_URL (optional Phase 2)

**DoD**:
- `npm install` succeeds
- `npx tsc --noEmit` passes on empty `src/index.ts`

---

### WU-2: DB Schema + Migrations

**Depends on**: WU-1

**Creates**: organizations.ts, users.ts, db/index.ts, 0001_create_organizations.sql, 0002_create_users.sql

Schema (from Approved feature db-spec — NOT the entity spec):
- `user_role` enum: admin, manager, sales_rep
- `user_status` enum: active, pending, deactivated
- organizations: id(uuid PK), name, slug(unique partial), created_at, updated_at, deleted_at
- users: id(uuid PK), organization_id(FK), first_name, last_name, email, password_hash, role(enum default admin), status(enum default active), invite_token, invite_token_expires_at, password_reset_token, password_reset_expires_at, deactivated_at, created_at, updated_at, deleted_at
- users indexes: `users_org_idx` on organization_id; `users_org_email_unique_idx` UNIQUE on (organization_id, email) WHERE deleted_at IS NULL

Migration notes:
- Migration path: `backend/drizzle/` per CLAUDE.md (not `backend/src/migrations/`)
- `CREATE TYPE IF NOT EXISTS` for enums to prevent errors on re-run
- `CREATE TABLE IF NOT EXISTS` for tables

**DoD**:
- `npx tsc --noEmit` passes
- Migration SQL is syntactically valid

---

### ⛳ CP-1: Human Checkpoint — DB Verified

**Do not proceed past WU-2 until ALL items are confirmed:**
- [ ] Applied `0001_create_organizations.sql` to Neon test DB
- [ ] Applied `0002_create_users.sql` to Neon test DB
- [ ] `organizations` table visible in Neon console with all columns
- [ ] `users` table visible with `user_role` and `user_status` enum type columns
- [ ] Partial unique indexes visible in Neon console → Schema → Indexes
- [ ] `npx tsc --noEmit` still passes

---

### WU-3: Lib Utilities

**Depends on**: WU-1
**Parallel with**: WU-4

**Creates**: `backend/src/config/env.ts`, `backend/src/lib/errors.ts`, `backend/src/lib/response.ts`, `backend/src/lib/jwt.ts`, `backend/src/lib/password.ts`

Key contracts:
- `env.ts`: Zod-validated; DATABASE_URL and JWT_SECRET are required (throws on startup if missing); SMTP_* and FRONTEND_URL are optional (Phase 2)
- `errors.ts`: `class AppError extends Error { constructor(code, message, statusCode, details = []) }`
- `response.ts`: `export function ok<T>(data: T) { return { data } }`
- `jwt.ts`: `signToken(payload)` and `verifyToken(token)` — wraps jsonwebtoken; exports `JwtPayload` interface: `{ sub, organizationId, role, iat?, exp? }`
- `password.ts`: `hashPassword(plain): Promise<string>` and `verifyPassword(plain, hash): Promise<boolean>` — bcryptjs, 12 rounds

**DoD**:
- No `any` types
- `env.ts` throws `ZodError` if `DATABASE_URL` is missing
- `npx tsc --noEmit` passes

---

### WU-4: Test Setup

**Depends on**: WU-1
**Parallel with**: WU-3

**Creates**: `backend/src/test/setup.ts`

This file is REQUIRED by `vitest.workspace.ts` line 18 (`setupFiles: ['backend/src/test/setup.ts']`). The workspace config already exists and is immutable — WU-4 only creates the file it references.

```typescript
// backend/src/test/setup.ts
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), 'backend/.env.test'), override: false })
config({ path: resolve(process.cwd(), 'backend/.env') })
```

**DoD**:
- File exists at `backend/src/test/setup.ts`
- `npx tsc --noEmit` passes
- Running `npx vitest run --project integration` does not produce "cannot find setupFile" error

---

### WU-5: Repository

**Depends on**: WU-2 (schema types), WU-3 (db client)

**Creates**: `backend/src/modules/auth/auth.repository.ts`

Note: auth follows the standard 5-file pattern including a repository. The repository owns all Drizzle queries; the service owns all business rules. (Architecture spec updated to reflect this.)

Interfaces:
```typescript
export interface CreateOrganizationInput { name: string; slug: string }
export interface CreateUserInput {
  organizationId: string; firstName: string; lastName?: string; email: string
  passwordHash: string; role: 'admin' | 'manager' | 'sales_rep'; status: 'active' | 'pending' | 'deactivated'
}
export interface UserRecord {
  id: string; organizationId: string; firstName: string; email: string
  passwordHash: string; role: 'admin' | 'manager' | 'sales_rep'; status: 'active' | 'pending' | 'deactivated'
}
```

Methods:
- `createOrganization(input): Promise<{ id: string; name: string; slug: string }>`
- `createUser(input): Promise<{ id: string }>`
- `findUserByEmailGlobal(email): Promise<UserRecord | undefined>` — WHERE email = ? AND deleted_at IS NULL

Rules: all queries use `isNull(users.deletedAt)` / `isNull(organizations.deletedAt)`. No `any` types. Drizzle query builder only.

**DoD**:
- No `any` types
- `npx tsc --noEmit` passes
- Interfaces match exactly

---

### WU-6: Service

**Depends on**: WU-3 (lib), WU-5 (repository)

**Creates**: `backend/src/modules/auth/auth.service.ts`

Types:
```typescript
export interface SignupInput   { orgName: string; firstName: string; email: string; password: string }
export interface SignupResult  { token: string; user: { id: string; role: string; firstName: string } }
export interface LoginInput    { email: string; password: string }
export interface LoginResult   { token: string; user: { id: string; firstName: string; role: string; organizationId: string } }
```

Methods: `signup(input): Promise<SignupResult>`, `login(input): Promise<LoginResult>`, `logout(): Promise<void>`

`signup()` order:
1. `findUserByEmailGlobal(email)` → if found: throw `AppError('CONFLICT', 'A user with this email already exists.', 409)`
2. Generate slug from orgName
3. `createOrganization({ name: orgName, slug })`
4. `hashPassword(password)`
5. `createUser({ organizationId, firstName, email, passwordHash, role: 'admin', status: 'active' })`
6. `signToken({ sub: user.id, organizationId, role: 'admin' })`
7. Return `{ token, user: { id, role: 'admin', firstName } }` — NO passwordHash field

`login()` order (matters — deactivated check before password check):
1. `findUserByEmailGlobal(email)` → if not found: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)`
2. If `status === 'deactivated'`: throw `AppError('FORBIDDEN', 'Your account has been deactivated. Contact your admin.', 403)`
3. If `status === 'pending'`: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)` — pending ≠ active
4. `verifyPassword(password, user.passwordHash)` → if false: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)`
5. `signToken({ sub: user.id, organizationId: user.organizationId, role: user.role })`
6. Return `{ token, user: { id, firstName, role, organizationId } }` — NO passwordHash

`logout()`: returns `Promise<void>`. No DB call. Client discards JWT.

Rules: No HTTP types. No Fastify types. No SQL. No `any`. All errors are `AppError`.

**DoD**:
- No `any` types
- `passwordHash` never in any return value
- `npx tsc --noEmit` passes

---

### WU-7: Controller + Routes + Middleware + Types

**Depends on**: WU-6 (service)

**Creates** (all 5 files in this WU):
- `backend/src/modules/auth/auth.schemas.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/middleware/authenticate.ts`
- `backend/src/types/fastify.d.ts`

`auth.schemas.ts`:
```typescript
export const signupSchema = z.object({
  orgName:   z.string().min(1, 'Organisation name is required'),
  firstName: z.string().min(1, 'First name is required'),
  email:     z.string().email('Valid email required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})
export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})
export type SignupBody = z.infer<typeof signupSchema>
export type LoginBody  = z.infer<typeof loginSchema>
```

`auth.controller.ts`:
```typescript
export async function signup(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = signupSchema.parse(req.body)
  const result = await service.signup(body)
  reply.status(201).send(ok(result))
}
export async function login(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = loginSchema.parse(req.body)
  const result = await service.login(body)
  reply.status(200).send(ok(result))
}
export async function logout(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await service.logout()
  reply.status(204).send()
}
```

`auth.routes.ts`:
```typescript
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/signup', controller.signup)
  app.post('/api/auth/login',  controller.login)
  app.post('/api/auth/logout', { onRequest: [authenticate] }, controller.logout)
}
```

`authenticate.ts`:
```typescript
export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing or invalid token.' })
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = { userId: payload.sub, organizationId: payload.organizationId, role: payload.role }
  } catch {
    reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing or invalid token.' })
  }
}
```

`fastify.d.ts`:
```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user: { userId: string; organizationId: string; role: 'admin' | 'manager' | 'sales_rep' }
  }
}
```

**DoD**:
- `npx tsc --noEmit` passes including `req.user` augmentation across all files
- Missing/invalid JWT on POST /api/auth/logout → 401 (authenticate middleware)
- Zod errors in controller → caught by global error handler → 400

---

### WU-8: App Wiring

**Depends on**: WU-7

**Creates**: `backend/src/app.ts`, `backend/src/index.ts`

`app.ts` MUST:
1. Register `authRoutes` via `app.register(authRoutes)`
2. Set global error handler: `AppError` → `{ error, message, details }` with statusCode; `ZodError` → 400 `{ error: 'VALIDATION_ERROR', message, details }`; unknown → 500

`index.ts`: imports env, calls `buildApp()`, calls `app.listen()`

**DoD**:
- `npm run dev` starts without error
- `npx tsc --noEmit` passes

---

### ⛳ CP-2: Human Checkpoint — Smoke Test

**Do not write tests until ALL items are confirmed manually (curl or Postman):**
- [ ] `POST /api/auth/signup` (valid body) → 201 + `{ data: { token, user: { id, role, firstName } } }`
- [ ] `POST /api/auth/signup` (duplicate email) → 409 `{ error: 'CONFLICT', message: '...' }`
- [ ] `POST /api/auth/signup` (password 7 chars) → 400 `{ error: 'VALIDATION_ERROR', details: [...] }`
- [ ] `POST /api/auth/login` (valid active user) → 200 + JWT
- [ ] `POST /api/auth/login` (wrong password) → 401
- [ ] `POST /api/auth/logout` (valid Bearer token) → 204 empty body
- [ ] `POST /api/auth/logout` (no Authorization header) → 401

---

### WU-9: Tests

**Depends on**: WU-5 (repository), WU-6 (service)

**Creates**: `backend/src/modules/auth/__tests__/auth.service.test.ts`, `backend/src/modules/auth/__tests__/auth.repository.test.ts`

#### auth.service.test.ts — 10 unit scenarios

Mocks: `vi.mock('../auth.repository')`, `vi.mock('../../../lib/password')`, `vi.mock('../../../lib/jwt')`

| ID | Method | Scenario | Assert |
|----|--------|----------|--------|
| auth-unit-01 | signup | valid inputs | calls createOrg + createUser + signToken; returns `{ token, user }` |
| auth-unit-02 | signup | success | returned `user` object has NO `passwordHash` field |
| auth-unit-03 | signup | call order | createOrganization called before createUser |
| auth-unit-04 | signup | duplicate email | throws `AppError` statusCode=409 code='CONFLICT' |
| auth-unit-05 | login | valid active user | returns `{ token, user }` with `organizationId` |
| auth-unit-06 | login | wrong password | throws `AppError` statusCode=401 code='UNAUTHORIZED' |
| auth-unit-07 | login | email not found | throws `AppError` statusCode=401 code='UNAUTHORIZED' (no 404 — no enumeration) |
| auth-unit-08 | login | deactivated user | throws `AppError` statusCode=403 code='FORBIDDEN' |
| auth-unit-09 | login | pending user | throws `AppError` statusCode=401 code='UNAUTHORIZED' (same as wrong creds) |
| auth-unit-10 | logout | always | returns `Promise<void>` without throwing; resolves to undefined |

#### auth.repository.test.ts — 6 integration scenarios

Test environment: Neon test DB via `DATABASE_URL` env var (loaded by `backend/src/test/setup.ts`).

**Required cleanup pattern (afterEach — soft delete only — never DELETE FROM)**:
```typescript
let testOrgId: string | undefined

afterEach(async () => {
  if (testOrgId) {
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.organizationId, testOrgId))
    await db.update(organizations).set({ deletedAt: new Date() }).where(eq(organizations.id, testOrgId))
    testOrgId = undefined
  }
})
```

| ID | Method | Scenario | Assert |
|----|--------|----------|--------|
| auth-int-01 | createOrganization | valid input | returns `{ id (UUID), name, slug }` |
| auth-int-02 | createUser | valid input | returns `{ id }` UUID; record physically exists in DB |
| auth-int-03 | findUserByEmailGlobal | email exists | returns record including `passwordHash` field |
| auth-int-04 | findUserByEmailGlobal | unknown email | returns `undefined` |
| auth-int-05 | findUserByEmailGlobal | soft-deleted user | returns `undefined` (WHERE deleted_at IS NULL) |
| auth-int-06 | createUser | duplicate (org_id, email) | Drizzle throws unique constraint violation |

---

## Business Rule → Test Mapping

| Rule | Where enforced | Test |
|------|---------------|------|
| BR-04: password min 8 | signupSchema (Zod → 400) | CP-2 item 3 (manual); Zod unit is implicit |
| BR-05: email unique | signup() → AppError 409 | auth-unit-04, auth-int-06 |
| BR-06: deactivated → 403 | login() status check before password verify | auth-unit-08 |
| BR-08: org_id from JWT | middleware + service never reads req.body.orgId | auth-int-01..06 |
| No hard deletes | afterEach uses UPDATE SET deleted_at | auth-int-05 (soft-deleted user invisible) |
| passwordHash never in response | signup() strips it | auth-unit-02 |
| No email enumeration | login() returns same 401 for wrong-pw + unknown-email | auth-unit-06, auth-unit-07 |
| logout is stateless | logout() no-op, returns void | auth-unit-10 |

---

## Overall DoD Checklist

- [ ] `npx tsc --noEmit` zero errors
- [ ] No `any` in service.ts, repository.ts, or lib files
- [ ] `POST /api/auth/signup` → 201 `{ data: { token, user: { id, role: 'admin', firstName } } }`
- [ ] `POST /api/auth/login` → 200/401/403 all correct per scenario
- [ ] `POST /api/auth/logout` → 204 with valid Bearer; 401 without
- [ ] Duplicate email on signup → 409
- [ ] All repo queries include `isNull(deletedAt)`
- [ ] Migration files at `backend/drizzle/` (not `backend/src/migrations/`)
- [ ] `organization_id` never from req.body — JWT only
- [ ] `passwordHash` never in any API response
- [ ] Unit tests: 10 scenarios pass (`npx vitest run --project unit`)
- [ ] Integration tests: 6 scenarios pass (`npx vitest run --project integration`)
- [ ] `backend/src/test/setup.ts` exists
- [ ] `backend/src/types/fastify.d.ts` exists

---

## Spec References

| Spec | Path |
|------|------|
| Feature spec | `specs/features/auth-user-management/feature-spec.md` |
| DB spec | `specs/features/auth-user-management/db-spec.md` |
| API spec | `specs/features/auth-user-management/api-spec.md` |
| Test spec | `specs/features/auth-user-management/test-spec.md` |
| Backend architecture | `specs/architecture/backend.md` (updated line 140 — auth now has 5 files including repository) |
