# Implementation Plan v2: Auth & User Management — Phase 1 (Signup, Login, Logout)
<!-- status: draft -->
<!-- gate-iteration: 2 -->
<!-- spec-authority: specs/features/auth-user-management/ + specs/architecture/backend.md -->

## Overview

Greenfield backend for 3 auth endpoints: signup, login, logout. No frontend. No invite flow. No password reset. 9-WU plan.

Module folder: `backend/src/modules/auth/` (per `specs/architecture/backend.md` lines 92-97 — NOT `auth-user-management/`).

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

### Middleware & Types
- `backend/src/middleware/authenticate.ts`
- `backend/src/types/fastify.d.ts`

### Module: auth
- `backend/src/modules/auth/auth.schemas.ts`
- `backend/src/modules/auth/auth.repository.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.routes.ts`

### Test Infrastructure
- `backend/src/test/setup.ts` ← REQUIRED by vitest.workspace.ts setupFiles

### Tests
- `backend/src/modules/auth/__tests__/auth.service.test.ts` ← matches glob `*.service.test.ts`
- `backend/src/modules/auth/__tests__/auth.repository.test.ts` ← matches glob `*.repository.test.ts`

### App Wiring
- `backend/src/app.ts`
- `backend/src/index.ts`

Total: 27 files

---

## Work Units

### WU-1: Scaffold

**Depends on**: nothing

**Files**:
- `backend/package.json` — dependencies: fastify ^4, drizzle-orm, @neondatabase/serverless, zod ^3, jsonwebtoken ^9, bcryptjs ^2, dotenv ^16; devDeps: typescript ^5, @types/node, @types/jsonwebtoken, @types/bcryptjs, drizzle-kit, vitest, ts-node
- `backend/tsconfig.json` — strict: true, moduleResolution: bundler, target: ES2022, include: ["src/**/*"]
- `backend/.env.example` — all vars listed with placeholders
- `backend/drizzle.config.ts` — out: "./drizzle", schema: "./src/db/schema"

**DoD**:
- `npm install` succeeds in `backend/`
- `npx tsc --noEmit` passes on an empty `src/index.ts`

---

### WU-2: DB Schema + Migrations

**Depends on**: WU-1

**Files**:

`backend/src/db/schema/organizations.ts`:
```typescript
import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const organizations = pgTable('organizations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 255 }).notNull(),
  slug:      varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  slugUniqueIdx: uniqueIndex('organizations_slug_unique_idx')
    .on(t.slug)
    .where(sql`deleted_at IS NULL`),
}))
```

`backend/src/db/schema/users.ts`:
```typescript
import { pgTable, pgEnum, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organizations } from './organizations'

export const userRoleEnum  = pgEnum('user_role',   ['admin', 'manager', 'sales_rep'])
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'deactivated'])

export const users = pgTable('users', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  organizationId:          uuid('organization_id').notNull().references(() => organizations.id),
  firstName:               varchar('first_name',  { length: 255 }).notNull(),
  lastName:                varchar('last_name',   { length: 255 }),
  email:                   varchar('email',        { length: 255 }).notNull(),
  passwordHash:            varchar('password_hash', { length: 255 }).notNull(),
  role:                    userRoleEnum('role').notNull().default('admin'),
  status:                  userStatusEnum('status').notNull().default('active'),
  inviteToken:             varchar('invite_token', { length: 255 }),
  inviteTokenExpiresAt:    timestamp('invite_token_expires_at',     { withTimezone: true }),
  passwordResetToken:      varchar('password_reset_token', { length: 255 }),
  passwordResetExpiresAt:  timestamp('password_reset_expires_at',   { withTimezone: true }),
  deactivatedAt:           timestamp('deactivated_at',              { withTimezone: true }),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:               timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  orgIdx:            index('users_org_idx').on(t.organizationId),
  orgEmailUniqueIdx: uniqueIndex('users_org_email_unique_idx')
    .on(t.organizationId, t.email)
    .where(sql`deleted_at IS NULL`),
}))
```

`backend/src/db/index.ts`:
```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../config/env'

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql)
```

`backend/drizzle/0001_create_organizations.sql`:
```sql
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique_idx
  ON organizations (slug) WHERE deleted_at IS NULL;
```

`backend/drizzle/0002_create_users.sql`:
```sql
CREATE TYPE IF NOT EXISTS user_role   AS ENUM ('admin', 'manager', 'sales_rep');
CREATE TYPE IF NOT EXISTS user_status AS ENUM ('active', 'pending', 'deactivated');

CREATE TABLE IF NOT EXISTS users (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name               VARCHAR(255) NOT NULL,
  last_name                VARCHAR(255),
  email                    VARCHAR(255) NOT NULL,
  password_hash            VARCHAR(255) NOT NULL,
  role                     user_role   NOT NULL DEFAULT 'admin',
  status                   user_status NOT NULL DEFAULT 'active',
  invite_token             VARCHAR(255),
  invite_token_expires_at  TIMESTAMPTZ,
  password_reset_token     VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  deactivated_at           TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_org_idx
  ON users (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_org_email_unique_idx
  ON users (organization_id, email) WHERE deleted_at IS NULL;
```

---

### ⛳ CP-1: Human Checkpoint — DB Verified

**Gate criteria** (do not proceed to WU-3+ until ALL are met):
- [ ] Applied migrations to Neon test DB (`npx drizzle-kit push` or paste SQL in Neon SQL editor)
- [ ] `organizations` table visible in Neon console with all columns
- [ ] `users` table visible with `user_role` and `user_status` enum columns
- [ ] Partial unique indexes visible in Neon → Schema → Indexes
- [ ] `npx tsc --noEmit` still passes

---

### WU-3: Lib Utilities

**Depends on**: WU-1 (packages installed)
**Parallel with**: WU-4

**Files**:

`backend/src/config/env.ts`:
```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL:   z.string().min(1),
  JWT_SECRET:     z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  PORT:           z.string().default('3000'),
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
  // Phase 2: SMTP vars — optional here so server starts without email infra in Phase 1
  SMTP_HOST:      z.string().optional(),
  SMTP_PORT:      z.string().optional(),
  SMTP_USER:      z.string().optional(),
  SMTP_PASS:      z.string().optional(),
  SMTP_FROM:      z.string().optional(),
  FRONTEND_URL:   z.string().optional(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
```

`backend/src/lib/errors.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details: unknown[] = [],
  ) { super(message) }
}
```

`backend/src/lib/response.ts`:
```typescript
export function ok<T>(data: T) {
  return { data }
}
```

`backend/src/lib/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  sub: string
  organizationId: string
  role: 'admin' | 'manager' | 'sales_rep'
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as string })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
```

`backend/src/lib/password.ts`:
```typescript
import bcrypt from 'bcryptjs'

const ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

**DoD**:
- No `any` types
- `env.ts` throws Zod error if DATABASE_URL or JWT_SECRET is missing
- `npx tsc --noEmit` passes

---

### WU-4: Test Setup

**Depends on**: WU-1 (packages installed)
**Parallel with**: WU-3

**Files**:

`backend/src/test/setup.ts`:
```typescript
import { config } from 'dotenv'
import { resolve } from 'path'

// Load test env — .env.test takes precedence over .env
config({ path: resolve(process.cwd(), '.env.test'), override: false })
config({ path: resolve(process.cwd(), '.env') })
```

> This file is the vitest integration test setup. It loads environment variables so the Drizzle client (`db/index.ts`) can connect to the Neon test DB. Without this file, integration tests will fail to load because `setupFiles: ['backend/src/test/setup.ts']` is non-negotiable in `vitest.workspace.ts`.

**DoD**:
- File exists at `backend/src/test/setup.ts`
- `npx tsc --noEmit` passes
- Running `npx vitest run --project integration` with a valid DATABASE_URL resolves without "cannot find setupFile" error

---

### WU-5: Repository

**Depends on**: WU-2 (schema types), WU-3 (db client, lib)

**File**: `backend/src/modules/auth/auth.repository.ts`

**Interfaces**:
```typescript
export interface CreateOrganizationInput {
  name: string
  slug: string
}

export interface CreateUserInput {
  organizationId: string
  firstName: string
  lastName?: string
  email: string
  passwordHash: string
  role: 'admin' | 'manager' | 'sales_rep'
  status: 'active' | 'pending' | 'deactivated'
}

export interface UserRecord {
  id: string
  organizationId: string
  firstName: string
  email: string
  passwordHash: string
  role: 'admin' | 'manager' | 'sales_rep'
  status: 'active' | 'pending' | 'deactivated'
}
```

**Methods**:
- `createOrganization(input: CreateOrganizationInput): Promise<{ id: string; name: string; slug: string }>`
- `createUser(input: CreateUserInput): Promise<{ id: string }>`
- `findUserByEmailGlobal(email: string): Promise<UserRecord | undefined>` — used for signup duplicate check; WHERE `email = ? AND deleted_at IS NULL`

**Rules**:
- All queries use `isNull(users.deletedAt)` / `isNull(organizations.deletedAt)`
- No `any` types — use Drizzle inferred types or explicit interfaces
- Drizzle query builder only — no raw SQL
- `passwordHash` selected in `findUserByEmailGlobal` (service needs it for bcrypt compare); service strips it before response

**DoD**:
- `npx tsc --noEmit` zero errors
- Interfaces match exactly
- No raw SQL strings

---

### WU-6: Service

**Depends on**: WU-3 (lib), WU-5 (repository)

**File**: `backend/src/modules/auth/auth.service.ts`

**Types**:
```typescript
export interface SignupInput   { orgName: string; firstName: string; email: string; password: string }
export interface SignupResult  { token: string; user: { id: string; role: string; firstName: string } }
export interface LoginInput    { email: string; password: string }
export interface LoginResult   { token: string; user: { id: string; firstName: string; role: string; organizationId: string } }
```

**Methods**: `signup(input: SignupInput): Promise<SignupResult>`, `login(input: LoginInput): Promise<LoginResult>`, `logout(): Promise<void>`

**`signup()` logic**:
1. `findUserByEmailGlobal(email)` — if found: throw `AppError('CONFLICT', 'A user with this email already exists.', 409)`
2. Generate slug: `orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`
3. `createOrganization({ name: orgName, slug })`
4. `hashPassword(password)` — min-8 enforced by Zod at schema layer; service does not re-validate
5. `createUser({ organizationId, firstName, email, passwordHash, role: 'admin', status: 'active' })`
6. `signToken({ sub: user.id, organizationId, role: 'admin' })`
7. Return `{ token, user: { id: user.id, role: 'admin', firstName } }` — NO passwordHash

**`login()` logic** (order matters — prevents timing attack and correct status code assignment):
1. `findUserByEmailGlobal(email)` — if not found: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)`
2. If `user.status === 'deactivated'`: throw `AppError('FORBIDDEN', 'Your account has been deactivated. Contact your admin.', 403)`
3. If `user.status === 'pending'`: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)` — pending treated as wrong credentials
4. `verifyPassword(password, user.passwordHash)` — if false: throw `AppError('UNAUTHORIZED', 'Invalid email or password.', 401)`
5. `signToken({ sub: user.id, organizationId: user.organizationId, role: user.role })`
6. Return `{ token, user: { id: user.id, firstName: user.firstName, role: user.role, organizationId: user.organizationId } }` — NO passwordHash

**`logout()`**: returns `void` — stateless; client discards JWT; no DB call.

**Rules**:
- No HTTP types, no Fastify types, no SQL
- No `any` types
- All errors are `AppError` instances (never raw `Error`)

**DoD**:
- `npx tsc --noEmit` zero errors
- No `any` types
- `passwordHash` never in return values

---

### WU-7: Controller + Routes + Middleware + Types

**Depends on**: WU-3 (lib), WU-6 (service)

**Files**:

`backend/src/modules/auth/auth.schemas.ts`:
```typescript
import { z } from 'zod'

export const signupSchema = z.object({
  orgName:   z.string().min(1, 'Organisation name is required'),
  firstName: z.string().min(1, 'First name is required'),
  email:     z.string().email('Valid email is required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export type SignupBody = z.infer<typeof signupSchema>
export type LoginBody  = z.infer<typeof loginSchema>
```

`backend/src/modules/auth/auth.controller.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './auth.service'
import { signupSchema, loginSchema } from './auth.schemas'
import { ok } from '../../lib/response'

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

`backend/src/modules/auth/auth.routes.ts`:
```typescript
import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import * as controller from './auth.controller'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/signup', controller.signup)
  app.post('/api/auth/login',  controller.login)
  app.post('/api/auth/logout', { onRequest: [authenticate] }, controller.logout)
}
```

`backend/src/middleware/authenticate.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../lib/jwt'

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing or invalid token.' })
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = {
      userId:         payload.sub,
      organizationId: payload.organizationId,
      role:           payload.role,
    }
  } catch {
    reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing or invalid token.' })
  }
}
```

`backend/src/types/fastify.d.ts`:
```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId:         string
      organizationId: string
      role:           'admin' | 'manager' | 'sales_rep'
    }
  }
}
```

**DoD**:
- `npx tsc --noEmit` passes including `req.user` augmentation
- Zod parse errors in controller produce 400 (caught by global error handler in WU-8)
- Missing/invalid JWT on logout → 401 (authenticate middleware, not service)

---

### WU-8: App Wiring

**Depends on**: WU-7

**Files**:

`backend/src/app.ts`:
```typescript
import Fastify, { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from './lib/errors'
import { authRoutes } from './modules/auth/auth.routes'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  // Register routes
  await app.register(authRoutes)

  // Global error handler — catches AppError + ZodError + unknown
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error:   error.code,
        message: error.message,
        details: error.details,
      })
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error:   'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.errors,
      })
    }
    app.log.error(error)
    return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' })
  })

  return app
}
```

`backend/src/index.ts`:
```typescript
import 'dotenv/config'
import { env } from './config/env'
import { buildApp } from './app'

const app = await buildApp()
await app.listen({ port: Number(env.PORT), host: '0.0.0.0' })
```

---

### ⛳ CP-2: Human Checkpoint — Smoke Test

**Gate criteria** (do not write tests until ALL pass with manual curl/Postman):
- [ ] `npm run dev` starts without error
- [ ] `POST /api/auth/signup` (valid body) → 201 + `{ data: { token, user: { id, role, firstName } } }`
- [ ] `POST /api/auth/signup` (duplicate email) → 409
- [ ] `POST /api/auth/login` (valid) → 200 + JWT
- [ ] `POST /api/auth/login` (wrong password) → 401
- [ ] `POST /api/auth/logout` (valid Bearer) → 204 empty
- [ ] `POST /api/auth/logout` (no Authorization header) → 401

---

### WU-9: Tests

**Depends on**: WU-5 (repository), WU-6 (service)

**Files**:

`backend/src/modules/auth/__tests__/auth.service.test.ts` — 9 unit scenarios:

| ID | Scenario | Assert |
|----|----------|--------|
| auth-unit-01 | signup valid | calls createOrg + createUser + signToken; returns `{ token, user }` |
| auth-unit-02 | signup success | returned `user` has NO `passwordHash` field |
| auth-unit-03 | signup call order | createOrganization called before createUser |
| auth-unit-04 | signup duplicate email | throws `AppError` with `statusCode: 409`, `code: 'CONFLICT'` |
| auth-unit-05 | login valid active | returns `{ token, user }` with `organizationId` field |
| auth-unit-06 | login wrong password | throws `AppError` with `statusCode: 401`, `code: 'UNAUTHORIZED'` |
| auth-unit-07 | login email not found | throws `AppError` with `statusCode: 401`, `code: 'UNAUTHORIZED'` (not 404) |
| auth-unit-08 | login deactivated | throws `AppError` with `statusCode: 403`, `code: 'FORBIDDEN'` |
| auth-unit-09 | login pending | throws `AppError` with `statusCode: 401`, `code: 'UNAUTHORIZED'` (same as wrong creds) |

Mocks: `vi.mock('../auth.repository')`, `vi.mock('../../../lib/password')`, `vi.mock('../../../lib/jwt')`

`backend/src/modules/auth/__tests__/auth.repository.test.ts` — 6 integration scenarios:

| ID | Scenario | Assert |
|----|----------|--------|
| auth-int-01 | createOrganization valid | returns `{ id (UUID), name, slug }` |
| auth-int-02 | createUser valid | returns `{ id }` UUID; record exists in DB |
| auth-int-03 | findUserByEmailGlobal exists | returns user record including `passwordHash` |
| auth-int-04 | findUserByEmailGlobal unknown | returns `undefined` |
| auth-int-05 | findUserByEmailGlobal soft-deleted | returns `undefined` (WHERE deleted_at IS NULL) |
| auth-int-06 | duplicate email same org | Drizzle throws unique constraint violation (DB-level guard) |

**Cleanup (required in afterEach — never DELETE FROM)**:
```typescript
let testOrgId: string | undefined

afterEach(async () => {
  if (testOrgId) {
    await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.organizationId, testOrgId))
    await db.update(organizations)
      .set({ deletedAt: new Date() })
      .where(eq(organizations.id, testOrgId))
    testOrgId = undefined
  }
})
```

**DoD**:
- `npx vitest run --project unit` — all 9 pass
- `npx vitest run --project integration` — all 6 pass (requires Neon test DB via DATABASE_URL)
- 0 TypeScript errors

---

## Business Rule → Test Mapping

| Rule | Where enforced | Test |
|------|---------------|------|
| BR-04: password min 8 chars | `signupSchema` Zod at controller | ZodError → 400 (manual CP-2) |
| BR-05: duplicate email → 409 | `signup()` service | auth-unit-04 |
| BR-06: deactivated → 403 | `login()` service, before password check | auth-unit-08 |
| BR-08: org_id from JWT only | Middleware + service (never reads req.body.orgId) | auth-int-01..06 |
| No hard deletes | Repository cleanup + afterEach | auth-int-05 |
| passwordHash never in response | signup() strips it | auth-unit-02 |
| No email enumeration | login() returns 401 for both wrong-pw and unknown-email | auth-unit-06, auth-unit-07 |

---

## Overall DoD Checklist

- [ ] `npx tsc --noEmit` zero errors
- [ ] No `any` in service.ts, repository.ts, or lib files
- [ ] `POST /api/auth/signup` → 201 `{ data: { token, user: { id, role, firstName } } }`
- [ ] `POST /api/auth/login` → 200/401/403 all correct
- [ ] `POST /api/auth/logout` → 204 with token, 401 without
- [ ] Duplicate email → 409
- [ ] All repo queries: `isNull(deletedAt)` present
- [ ] Migration files in `backend/drizzle/` (not `backend/src/migrations/`)
- [ ] `organization_id` never from req.body — JWT only
- [ ] `passwordHash` never in any API response
- [ ] Unit tests: 9 scenarios pass in `auth.service.test.ts`
- [ ] Integration tests: 6 scenarios pass in `auth.repository.test.ts`
- [ ] `backend/src/test/setup.ts` exists

---

## Spec References

| Spec | Path |
|------|------|
| Feature spec | `specs/features/auth-user-management/feature-spec.md` |
| DB spec | `specs/features/auth-user-management/db-spec.md` |
| API spec | `specs/features/auth-user-management/api-spec.md` |
| Test spec | `specs/features/auth-user-management/test-spec.md` |
| Backend architecture | `specs/architecture/backend.md` |
