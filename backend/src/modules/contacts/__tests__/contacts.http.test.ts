import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { buildApp } from '../../../app'
import { db } from '../../../db/index'
import { organizations } from '../../../db/schema/organizations'
import { users } from '../../../db/schema/users'
import { contacts } from '../../../db/schema/contacts'
import { createTestToken } from '../../../test/helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
const cleanupContactIds: string[] = []
const cleanupUserIds:    string[] = []
const cleanupOrgIds:     string[] = []

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  for (const id of cleanupContactIds) {
    await db.delete(contacts).where(eq(contacts.id, id))
  }
  for (const id of cleanupUserIds) {
    await db.delete(users).where(eq(users.id, id))
  }
  for (const id of cleanupOrgIds) {
    await db.delete(organizations).where(eq(organizations.id, id))
  }
  await app.close()
})

async function seedOrg() {
  const [org] = await db
    .insert(organizations)
    .values({ name: 'HTTP Test Org', slug: `http-slug-${randomUUID()}` })
    .returning()
  cleanupOrgIds.push(org.id)
  return org
}

async function seedUser(orgId: string, role: 'admin' | 'manager' | 'sales_rep' = 'admin') {
  const [user] = await db
    .insert(users)
    .values({
      organizationId: orgId,
      firstName:      'HTTP',
      email:          `http-${randomUUID()}@example.com`,
      passwordHash:   'hashed-pw',
      role,
      status:         'active',
    })
    .returning()
  cleanupUserIds.push(user.id)
  return user
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('contacts HTTP smoke tests', () => {
  it('contacts-smoke-01: POST /api/contacts — 201 with valid body', async () => {
    const org  = await seedOrg()
    const user = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Smoke', lastName: 'Test', email: `smoke-${randomUUID()}@example.com` },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.firstName).toBe('Smoke')
    cleanupContactIds.push(body.data.id)
  })

  it('contacts-smoke-02: GET /api/contacts — 200 with pagination', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const res = await app.inject({
      method:  'GET',
      url:     '/api/contacts',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('pagination')
  })

  it('contacts-smoke-03: GET /api/contacts/:id — 200 for existing contact', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const createRes = await app.inject({
      method:  'POST',
      url:     '/api/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Detail' },
    })
    const contactId = createRes.json().data.id
    cleanupContactIds.push(contactId)

    const res = await app.inject({
      method:  'GET',
      url:     `/api/contacts/${contactId}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(contactId)
  })

  it('contacts-smoke-04: GET /api/contacts/:id — 403 for non-existent id (IDOR prevention)', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const res = await app.inject({
      method:  'GET',
      url:     `/api/contacts/${randomUUID()}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })

  it('contacts-smoke-05: PUT /api/contacts/:id — 200 updates contact', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const createRes = await app.inject({
      method:  'POST',
      url:     '/api/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Before' },
    })
    const contactId = createRes.json().data.id
    cleanupContactIds.push(contactId)

    const res = await app.inject({
      method:  'PUT',
      url:     `/api/contacts/${contactId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'After' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.firstName).toBe('After')
  })

  it('contacts-smoke-06: DELETE /api/contacts/:id — 204 for admin', async () => {
    const org   = await seedOrg()
    const user  = await seedUser(org.id, 'admin')
    const token = createTestToken({ userId: user.id, organizationId: org.id, role: 'admin' })

    const createRes = await app.inject({
      method:  'POST',
      url:     '/api/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'ToDelete' },
    })
    const contactId = createRes.json().data.id
    cleanupContactIds.push(contactId)

    const res = await app.inject({
      method:  'DELETE',
      url:     `/api/contacts/${contactId}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('contacts-smoke-07: all routes — 401 without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/api/contacts',
    })

    expect(res.statusCode).toBe(401)
  })
})
