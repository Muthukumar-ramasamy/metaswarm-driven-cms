import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import {
  findByEmail,
  findById,
  findUserInOrg,
  create,
  list,
  update,
  softDelete,
} from '../contacts.repository'
import { db } from '../../../db/index'
import { organizations } from '../../../db/schema/organizations'
import { users } from '../../../db/schema/users'
import { contacts } from '../../../db/schema/contacts'

let cleanupContactIds: string[] = []
let cleanupUserIds:    string[] = []
let cleanupOrgIds:     string[] = []

beforeEach(() => {
  cleanupContactIds = []
  cleanupUserIds    = []
  cleanupOrgIds     = []
})

afterEach(async () => {
  for (const id of cleanupContactIds) {
    await db.delete(contacts).where(eq(contacts.id, id))
  }
  for (const id of cleanupUserIds) {
    await db.delete(users).where(eq(users.id, id))
  }
  for (const id of cleanupOrgIds) {
    await db.delete(organizations).where(eq(organizations.id, id))
  }
})

async function seedOrg() {
  const [org] = await db
    .insert(organizations)
    .values({ name: 'Test Org', slug: `slug-${randomUUID()}` })
    .returning()
  cleanupOrgIds.push(org.id)
  return org
}

async function seedUser(
  orgId: string,
  overrides: Partial<{ email: string; role: 'admin' | 'manager' | 'sales_rep' }> = {},
) {
  const [user] = await db
    .insert(users)
    .values({
      organizationId: orgId,
      firstName:      'Test',
      email:          overrides.email ?? `test-${randomUUID()}@example.com`,
      passwordHash:   'hashed-pw',
      role:           overrides.role ?? 'sales_rep',
      status:         'active',
    })
    .returning()
  cleanupUserIds.push(user.id)
  return user
}

async function seedContact(
  orgId: string,
  ownerId: string,
  createdBy: string,
  overrides: Partial<{
    email: string
    firstName: string
    deletedAt: Date
  }> = {},
) {
  const contact = await create({
    organizationId: orgId,
    ownerId,
    createdBy,
    firstName:      overrides.firstName ?? 'John',
    email:          overrides.email,
  })
  if (overrides.deletedAt) {
    await db
      .update(contacts)
      .set({ deletedAt: overrides.deletedAt })
      .where(eq(contacts.id, contact.id))
  }
  cleanupContactIds.push(contact.id)
  return contact
}

// ─── findByEmail ─────────────────────────────────────────────────────────────

describe('contacts.repository', () => {
  it('contacts-int-01: findByEmail returns contact when email matches in org', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id)
    const email = `find-${randomUUID()}@example.com`
    await seedContact(org.id, user.id, user.id, { email })

    const found = await findByEmail(org.id, email)

    expect(found).toBeDefined()
    expect(found?.email).toBe(email)
  })

  it('contacts-int-02: findByEmail returns undefined for different org', async () => {
    const org1 = await seedOrg()
    const org2 = await seedOrg()
    const u1   = await seedUser(org1.id)
    const u2   = await seedUser(org2.id)
    const email = `cross-${randomUUID()}@example.com`
    await seedContact(org1.id, u1.id, u1.id, { email })

    const found = await findByEmail(org2.id, email)

    expect(found).toBeUndefined()
  })

  it('contacts-int-03: findByEmail returns undefined for soft-deleted contact', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id)
    const email = `deleted-${randomUUID()}@example.com`
    await seedContact(org.id, user.id, user.id, { email, deletedAt: new Date() })

    const found = await findByEmail(org.id, email)

    expect(found).toBeUndefined()
  })

  // ─── findById ──────────────────────────────────────────────────────────────

  it('contacts-int-04: findById returns contact for correct org', async () => {
    const org     = await seedOrg()
    const user    = await seedUser(org.id)
    const contact = await seedContact(org.id, user.id, user.id)

    const found = await findById(org.id, contact.id)

    expect(found).toBeDefined()
    expect(found?.id).toBe(contact.id)
    expect(found?.organizationId).toBe(org.id)
  })

  it('contacts-int-05: findById returns undefined for wrong org', async () => {
    const org1 = await seedOrg()
    const org2 = await seedOrg()
    const u1   = await seedUser(org1.id)
    const c    = await seedContact(org1.id, u1.id, u1.id)

    const found = await findById(org2.id, c.id)

    expect(found).toBeUndefined()
  })

  it('contacts-int-06: findById returns undefined for soft-deleted contact', async () => {
    const org     = await seedOrg()
    const user    = await seedUser(org.id)
    const contact = await seedContact(org.id, user.id, user.id, { deletedAt: new Date() })

    const found = await findById(org.id, contact.id)

    expect(found).toBeUndefined()
  })

  // ─── findUserInOrg ─────────────────────────────────────────────────────────

  it('contacts-int-07: findUserInOrg returns user when userId is in org', async () => {
    const org  = await seedOrg()
    const user = await seedUser(org.id)

    const found = await findUserInOrg(org.id, user.id)

    expect(found).toBeDefined()
    expect(found?.id).toBe(user.id)
  })

  it('contacts-int-08: findUserInOrg returns undefined when user is in different org', async () => {
    const org1 = await seedOrg()
    const org2 = await seedOrg()
    const user = await seedUser(org1.id)

    const found = await findUserInOrg(org2.id, user.id)

    expect(found).toBeUndefined()
  })

  // ─── create ────────────────────────────────────────────────────────────────

  it('contacts-int-09: create inserts contact and returns row with UUID', async () => {
    const org     = await seedOrg()
    const user    = await seedUser(org.id)
    const contact = await create({
      organizationId: org.id,
      ownerId:        user.id,
      createdBy:      user.id,
      firstName:      'Jane',
    })
    cleanupContactIds.push(contact.id)

    expect(contact.id).toBeTypeOf('string')
    expect(contact.firstName).toBe('Jane')
    expect(contact.organizationId).toBe(org.id)
    expect(contact.deletedAt).toBeNull()
  })

  it('contacts-int-10: create stores email lowercased (service normalizes, repo stores)', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id)
    const email = `jane-${randomUUID()}@example.com`
    const c     = await create({
      organizationId: org.id,
      ownerId:        user.id,
      createdBy:      user.id,
      firstName:      'Jane',
      email,
    })
    cleanupContactIds.push(c.id)

    expect(c.email).toBe(email)
  })

  // ─── list ──────────────────────────────────────────────────────────────────

  it('contacts-int-11: list returns only active contacts for org', async () => {
    const org  = await seedOrg()
    const user = await seedUser(org.id)
    await seedContact(org.id, user.id, user.id, { firstName: 'Active' })
    await seedContact(org.id, user.id, user.id, { firstName: 'Deleted', deletedAt: new Date() })

    const result = await list(org.id, { page: 1, limit: 20 })

    const names = result.rows.map((r) => r.firstName)
    expect(names).toContain('Active')
    expect(names).not.toContain('Deleted')
  })

  it('contacts-int-12: list with ownerId filter returns only that owner contacts', async () => {
    const org    = await seedOrg()
    const owner1 = await seedUser(org.id, { email: `o1-${randomUUID()}@x.com` })
    const owner2 = await seedUser(org.id, { email: `o2-${randomUUID()}@x.com` })
    await seedContact(org.id, owner1.id, owner1.id, { firstName: 'O1Contact' })
    await seedContact(org.id, owner2.id, owner2.id, { firstName: 'O2Contact' })

    const result = await list(org.id, { page: 1, limit: 20, ownerId: owner1.id })

    const names = result.rows.map((r) => r.firstName)
    expect(names).toContain('O1Contact')
    expect(names).not.toContain('O2Contact')
  })

  it('contacts-int-13: list returns correct total count', async () => {
    const org  = await seedOrg()
    const user = await seedUser(org.id)
    await seedContact(org.id, user.id, user.id)
    await seedContact(org.id, user.id, user.id)

    const result = await list(org.id, { page: 1, limit: 20 })

    expect(result.total).toBeGreaterThanOrEqual(2)
  })

  // ─── update ────────────────────────────────────────────────────────────────

  it('contacts-int-14: update patches fields and returns updated row', async () => {
    const org     = await seedOrg()
    const user    = await seedUser(org.id)
    const contact = await seedContact(org.id, user.id, user.id, { firstName: 'Before' })

    const updated = await update(org.id, contact.id, { firstName: 'After', jobTitle: 'CEO' })

    expect(updated.firstName).toBe('After')
    expect(updated.jobTitle).toBe('CEO')
  })

  // ─── softDelete ────────────────────────────────────────────────────────────

  it('contacts-int-15: softDelete sets deletedAt and contact is no longer findable', async () => {
    const org     = await seedOrg()
    const user    = await seedUser(org.id)
    const contact = await seedContact(org.id, user.id, user.id)

    await softDelete(org.id, contact.id)

    const found = await findById(org.id, contact.id)
    expect(found).toBeUndefined()
  })

  it('contacts-int-16: softDelete scoped by org — cannot delete contact from different org', async () => {
    const org1 = await seedOrg()
    const org2 = await seedOrg()
    const u1   = await seedUser(org1.id)
    const c    = await seedContact(org1.id, u1.id, u1.id)

    await softDelete(org2.id, c.id)

    // Contact in org1 should still be findable
    const found = await findById(org1.id, c.id)
    expect(found).toBeDefined()
  })
})
