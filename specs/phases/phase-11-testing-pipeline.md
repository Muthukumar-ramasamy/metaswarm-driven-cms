 # Phase 11 — Testing Pipeline

**Status**: ✅ Complete  
**Goal**: Configure the full test stack (unit → integration → E2E) so `/generate-tests` has a working infrastructure to write into.

---

## Test layers

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit | Vitest | Service business rules, pure functions | Fast (~ms) |
| Integration | Vitest | Repository queries against live Neon test DB | Medium (~s) |
| E2E | Playwright | Full user flows in the browser | Slow (~min) |

---

## Test database strategy

All integration tests run against a **real Neon database** — no mocks.

**Why**: Mock databases hide migration bugs and constraint violations. The prior CRM project caught a broken migration only in production because mocked tests passed.

**Isolation**: Each test suite calls `cleanupOrg(orgId)` at the end to soft-delete all seeded data. Tests never share organization IDs. The `organization_id` UUID is generated fresh per suite.

**Branch**: Use the same `production` Neon branch for now. Post-MVP: create a dedicated `test` branch via Neon MCP.

---

## File layout

```
backend/
  vitest.config.ts           ← Unit + integration config (two projects)
  src/
    test/
      setup.ts               ← Global setup: load .env, connect DB
      helpers.ts             ← seedOrganization, seedUser, createTestToken, cleanupOrg

frontend/
  vitest.config.ts           ← Component + hook unit tests (jsdom)

e2e/
  playwright.config.ts       ← Full browser E2E config
  helpers.ts                 ← loginAs, navigate, fill helpers
  fixtures/
    users.ts                 ← Test user factories

.github/
  workflows/
    ci.yml                   ← Run unit + integration + E2E on push to main
```

---

## Vitest config (backend)

Two projects in one config — unit and integration run separately:

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        name: 'unit',
        include: ['src/modules/**/*.test.ts'],
        exclude: ['src/modules/**/*.integration.test.ts'],
        environment: 'node',
      },
      {
        name: 'integration',
        include: ['src/modules/**/*.integration.test.ts'],
        environment: 'node',
        setupFiles: ['src/test/setup.ts'],
        pool: 'forks',        // serial — avoids DB connection pool exhaustion
        poolOptions: { forks: { singleFork: true } },
      },
    ],
  },
})
```

Scripts in `backend/package.json`:
```json
"test:unit":        "vitest run --project unit",
"test:integration": "vitest run --project integration",
"test:all":         "vitest run"
```

---

## Test helpers (backend)

**`src/test/helpers.ts`**:

```typescript
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config'

const sql = neon(config.DATABASE_URL)
export const db = drizzle(sql)

export async function seedOrganization() {
  const id = randomUUID()
  await db.execute(sql`
    INSERT INTO organizations (id, name, created_at, updated_at)
    VALUES (${id}, ${'Test Org ' + id.slice(0, 8)}, NOW(), NOW())
  `)
  return id
}

export async function seedUser(organizationId: string, role = 'sales_rep') {
  const id = randomUUID()
  await db.execute(sql`
    INSERT INTO users (id, organization_id, email, password_hash, role, status, created_at, updated_at)
    VALUES (${id}, ${organizationId}, ${id + '@test.com'}, 'hashed', ${role}, 'active', NOW(), NOW())
  `)
  return { id, organizationId, role, email: id + '@test.com' }
}

export function createTestToken(user: { id: string; organizationId: string; role: string }) {
  return jwt.sign(
    { sub: user.id, organizationId: user.organizationId, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

export async function cleanupOrg(organizationId: string) {
  // Soft-delete all records in the org — never DELETE FROM
  const tables = [
    'notes', 'activities', 'deals', 'deal_stage_history',
    'leads', 'contacts', 'companies', 'pipeline_stages',
    'pipelines', 'users',
  ]
  for (const table of tables) {
    await db.execute(sql`
      UPDATE ${sql.identifier(table)}
      SET deleted_at = NOW()
      WHERE organization_id = ${organizationId}
        AND deleted_at IS NULL
    `)
  }
  await db.execute(sql`
    UPDATE organizations SET deleted_at = NOW()
    WHERE id = ${organizationId} AND deleted_at IS NULL
  `)
}
```

---

## Playwright config (E2E)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,      // serial to avoid data collisions
  retries: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: './frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
```

---

## E2E helpers

```typescript
// e2e/helpers.ts
import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('[name=email]', email)
  await page.fill('[name=password]', password)
  await page.click('[type=submit]')
  await page.waitForURL('/')
}
```

---

## CI workflow (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
      FRONTEND_URL: http://localhost:5173

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install backend deps
        working-directory: backend
        run: npm ci

      - name: Install frontend deps
        working-directory: frontend
        run: npm ci

      - name: Run unit tests
        working-directory: backend
        run: npm run test:unit

      - name: Run integration tests
        working-directory: backend
        run: npm run test:integration

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test naming convention

| ID format | Example | Location |
|-----------|---------|----------|
| `{feature}-unit-{NN}` | `auth-unit-01` | `__tests__/{feature}.service.test.ts` |
| `{feature}-int-{NN}` | `auth-int-01` | `__tests__/{feature}.repository.integration.test.ts` |
| `{feature}-e2e-{NN}` | `auth-e2e-01` | `e2e/{feature}.spec.ts` |

Test IDs must match the coverage map in `specs/features/{feature}/test-spec.md`.

---

## Coverage targets (non-blocking for MVP)

| Layer | Target |
|-------|--------|
| Unit (service) | 100% of BR-NN business rules |
| Integration (repository) | 100% of query paths + multi-tenancy isolation |
| E2E | 100% of AC-NN acceptance criteria |

---

## Next step

Run `/scaffold` to create the project structure, then these config files are written as part of scaffold Step 3. After scaffold, run `/approve-spec AuthUserManagement` to begin the first feature implementation.
