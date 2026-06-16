import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { createOrganization, createUser, findUserByEmailGlobal } from '../auth.repository'
import { db } from '../../../db/index'
import { organizations } from '../../../db/schema/organizations'
import { users } from '../../../db/schema/users'

let cleanupUserIds: string[] = []
let cleanupOrgIds:  string[] = []

beforeEach(() => {
  cleanupUserIds = []
  cleanupOrgIds  = []
})

afterEach(async () => {
  // Hard-delete in test teardown only — application code uses soft deletes
  for (const id of cleanupUserIds) {
    await db.delete(users).where(eq(users.id, id))
  }
  for (const id of cleanupOrgIds) {
    await db.delete(organizations).where(eq(organizations.id, id))
  }
})

async function seedOrg() {
  const slug = `test-${randomUUID()}`
  const org  = await createOrganization({ name: 'Test Org', slug })
  cleanupOrgIds.push(org.id)
  return org
}

async function seedUser(orgId: string, overrides: Partial<{
  email: string
  firstName: string
  role: 'admin' | 'manager' | 'sales_rep'
  status: 'active' | 'pending' | 'deactivated'
}> = {}) {
  const user = await createUser({
    organizationId: orgId,
    firstName:      overrides.firstName ?? 'Test',
    email:          overrides.email     ?? `test-${randomUUID()}@example.com`,
    passwordHash:   'hashed-pw',
    role:           overrides.role      ?? 'admin',
    status:         overrides.status    ?? 'active',
  })
  cleanupUserIds.push(user.id)
  return user
}

describe('auth.repository', () => {
  it('auth-int-01: createOrganization inserts org and returns id, name, slug', async () => {
    const slug = `test-${randomUUID()}`
    const org  = await createOrganization({ name: 'Acme Inc', slug })
    cleanupOrgIds.push(org.id)

    expect(org.id).toBeTypeOf('string')
    expect(org.name).toBe('Acme Inc')
    expect(org.slug).toBe(slug)
  })

  it('auth-int-02: createUser inserts user and returns id', async () => {
    const org  = await seedOrg()
    const user = await seedUser(org.id, { firstName: 'Alice', role: 'admin' })

    expect(user.id).toBeTypeOf('string')
  })

  it('auth-int-03: findUserByEmailGlobal returns UserRecord for existing active user', async () => {
    const org   = await seedOrg()
    const email = `test-${randomUUID()}@example.com`
    await seedUser(org.id, { email, firstName: 'Bob', role: 'sales_rep' })

    const found = await findUserByEmailGlobal(email)

    expect(found).toBeDefined()
    expect(found?.email).toBe(email)
    expect(found?.role).toBe('sales_rep')
    expect(found?.passwordHash).toBe('hashed-pw')
    expect(found?.organizationId).toBe(org.id)
  })

  it('auth-int-04: findUserByEmailGlobal returns undefined for unknown email', async () => {
    const found = await findUserByEmailGlobal(`nobody-${randomUUID()}@example.com`)

    expect(found).toBeUndefined()
  })

  it('auth-int-05: findUserByEmailGlobal returns undefined for soft-deleted user', async () => {
    const org   = await seedOrg()
    const email = `test-${randomUUID()}@example.com`
    const user  = await seedUser(org.id, { email })

    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, user.id))

    const found = await findUserByEmailGlobal(email)

    expect(found).toBeUndefined()
  })

  it('auth-int-06: createUser correctly sets organization_id on the user row', async () => {
    const org   = await seedOrg()
    const email = `test-${randomUUID()}@example.com`
    await seedUser(org.id, { email })

    const found = await findUserByEmailGlobal(email)

    expect(found?.organizationId).toBe(org.id)
  })
})
