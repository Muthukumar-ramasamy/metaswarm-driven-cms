import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../contacts.repository', () => ({
  findByEmail:    vi.fn(),
  findById:       vi.fn(),
  findUserInOrg:  vi.fn(),
  create:         vi.fn(),
  list:           vi.fn(),
  update:         vi.fn(),
  softDelete:     vi.fn(),
}))

import {
  createContact,
  listContacts,
  getContact,
  updateContact,
  deleteContact,
} from '../contacts.service'
import {
  findByEmail,
  findById,
  findUserInOrg,
  create,
  list,
  update,
  softDelete,
} from '../contacts.repository'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseContact = {
  id:             'contact-uuid-1',
  organizationId: 'org-uuid-1',
  ownerId:        'user-uuid-rep',
  createdBy:      'user-uuid-rep',
  companyId:      null,
  firstName:      'John',
  lastName:       'Doe',
  email:          'john@example.com',
  phone:          null,
  jobTitle:       null,
  linkedinUrl:    null,
  source:         null,
  createdAt:      new Date('2026-01-01'),
  updatedAt:      new Date('2026-01-01'),
  deletedAt:      null,
}

const adminCaller   = { userId: 'user-uuid-admin',   organizationId: 'org-uuid-1', role: 'admin'     as const }
const managerCaller = { userId: 'user-uuid-manager', organizationId: 'org-uuid-1', role: 'manager'   as const }
const repCaller     = { userId: 'user-uuid-rep',     organizationId: 'org-uuid-1', role: 'sales_rep' as const }
const otherRep      = { userId: 'user-uuid-other',   organizationId: 'org-uuid-1', role: 'sales_rep' as const }

// ─── createContact ─────────────────────────────────────────────────────────────

describe('contacts.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('contacts-unit-01: createContact — firstName only (no email)', async () => {
    vi.mocked(create).mockResolvedValue({ ...baseContact, email: null })

    const result = await createContact(repCaller, { firstName: 'John' })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'John', email: null }),
    )
    expect(result.firstName).toBe('John')
  })

  it('contacts-unit-02: createContact — all fields', async () => {
    vi.mocked(findByEmail).mockResolvedValue(undefined)
    vi.mocked(create).mockResolvedValue(baseContact)

    const result = await createContact(repCaller, {
      firstName: 'John',
      lastName:  'Doe',
      email:     'john@example.com',
      phone:     '555-1234',
      jobTitle:  'Engineer',
      source:    'website',
    })

    expect(create).toHaveBeenCalled()
    expect(result.lastName).toBe('Doe')
  })

  it('contacts-unit-03: createContact — throws ConflictError for duplicate email in org', async () => {
    vi.mocked(findByEmail).mockResolvedValue(baseContact)

    await expect(createContact(repCaller, { firstName: 'Jane', email: 'john@example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 })

    expect(create).not.toHaveBeenCalled()
  })

  it('contacts-unit-04: createContact — sales_rep: ownerId forced = caller.userId ignoring body', async () => {
    vi.mocked(create).mockResolvedValue({ ...baseContact, ownerId: repCaller.userId })

    await createContact(repCaller, { firstName: 'John', ownerId: 'some-other-user-id' })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: repCaller.userId }),
    )
  })

  it('contacts-unit-04b: createContact — email normalized to lowercase', async () => {
    vi.mocked(findByEmail).mockResolvedValue(undefined)
    vi.mocked(create).mockResolvedValue({ ...baseContact, email: 'john@example.com' })

    await createContact(repCaller, { firstName: 'John', email: 'JOHN@EXAMPLE.COM' })

    expect(findByEmail).toHaveBeenCalledWith('org-uuid-1', 'john@example.com')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'john@example.com' }),
    )
  })

  it('contacts-unit-04c: createContact — admin/manager: ownerId defaults to caller.userId when not in body', async () => {
    vi.mocked(create).mockResolvedValue({ ...baseContact, ownerId: adminCaller.userId })

    await createContact(adminCaller, { firstName: 'John' })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: adminCaller.userId }),
    )
  })

  // ─── listContacts ─────────────────────────────────────────────────────────

  it('contacts-unit-05: listContacts — sales_rep: ownerId forced = caller.userId', async () => {
    vi.mocked(list).mockResolvedValue({ rows: [], total: 0 })

    await listContacts(repCaller, { page: 1, limit: 20 })

    expect(list).toHaveBeenCalledWith(
      'org-uuid-1',
      expect.objectContaining({ ownerId: repCaller.userId }),
    )
  })

  it('contacts-unit-06: listContacts — manager: no ownerId filter passed', async () => {
    vi.mocked(list).mockResolvedValue({ rows: [baseContact], total: 1 })

    await listContacts(managerCaller, { page: 1, limit: 20 })

    const callArg = vi.mocked(list).mock.calls[0][1]
    expect(callArg.ownerId).toBeUndefined()
  })

  it('contacts-unit-07: listContacts — returns { data, pagination: { page, limit, total } }', async () => {
    vi.mocked(list).mockResolvedValue({ rows: [baseContact], total: 1 })

    const result = await listContacts(adminCaller, { page: 1, limit: 20 })

    expect(result).toMatchObject({
      data:       expect.any(Array),
      pagination: { page: 1, limit: 20, total: 1 },
    })
  })

  // ─── updateContact ────────────────────────────────────────────────────────

  it('contacts-unit-08: updateContact — sales_rep (owner) updates own contact', async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: repCaller.userId })
    vi.mocked(update).mockResolvedValue({ ...baseContact, firstName: 'Johnny' })

    const result = await updateContact(repCaller, 'contact-uuid-1', { firstName: 'Johnny' })

    expect(update).toHaveBeenCalled()
    expect(result.firstName).toBe('Johnny')
  })

  it("contacts-unit-09: updateContact — sales_rep throws ForbiddenError when updating another rep's contact", async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: 'user-uuid-other' })

    await expect(updateContact(repCaller, 'contact-uuid-1', { firstName: 'Johnny' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(update).not.toHaveBeenCalled()
  })

  it('contacts-unit-10: updateContact — manager can update any org contact', async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: repCaller.userId })
    vi.mocked(update).mockResolvedValue({ ...baseContact, firstName: 'Updated' })

    const result = await updateContact(managerCaller, 'contact-uuid-1', { firstName: 'Updated' })

    expect(update).toHaveBeenCalled()
    expect(result.firstName).toBe('Updated')
  })

  // ─── deleteContact ────────────────────────────────────────────────────────

  it('contacts-unit-11: deleteContact — admin soft-deletes (calls repo.softDelete)', async () => {
    vi.mocked(findById).mockResolvedValue(baseContact)
    vi.mocked(softDelete).mockResolvedValue({ ...baseContact, deletedAt: new Date() })

    await deleteContact(adminCaller, 'contact-uuid-1')

    expect(softDelete).toHaveBeenCalledWith('org-uuid-1', 'contact-uuid-1')
  })

  it('contacts-unit-12: deleteContact — ForbiddenError for manager', async () => {
    await expect(deleteContact(managerCaller, 'contact-uuid-1'))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(softDelete).not.toHaveBeenCalled()
  })

  it('contacts-unit-12b: deleteContact — ForbiddenError for sales_rep', async () => {
    await expect(deleteContact(repCaller, 'contact-uuid-1'))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(softDelete).not.toHaveBeenCalled()
  })

  // ─── getContact ───────────────────────────────────────────────────────────

  it('contacts-unit-13: getContact — returns contact with deals: [] and activities: []', async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: repCaller.userId })

    const result = await getContact(repCaller, 'contact-uuid-1')

    expect(result.deals).toEqual([])
    expect(result.activities).toEqual([])
  })

  it('contacts-unit-14: getContact — ForbiddenError (403, not 404) for non-existent contact', async () => {
    vi.mocked(findById).mockResolvedValue(undefined)

    await expect(getContact(adminCaller, 'no-such-id'))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })
  })

  it('contacts-unit-15: getContact — sales_rep gets SAME 403 for contact they do not own', async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: 'user-uuid-other' })

    const err403 = await getContact(repCaller, 'contact-uuid-1').catch((e) => e)

    expect(err403).toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })
    expect(err403.message).toBe('Access denied')
  })

  it('contacts-unit-14 error matches contacts-unit-15 error (identical 403)', async () => {
    vi.mocked(findById).mockResolvedValue(undefined)
    const notFoundErr = await getContact(adminCaller, 'no-such-id').catch((e) => e)

    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: 'user-uuid-other' })
    const wrongOwnerErr = await getContact(repCaller, 'contact-uuid-1').catch((e) => e)

    expect(notFoundErr.code).toBe(wrongOwnerErr.code)
    expect(notFoundErr.statusCode).toBe(wrongOwnerErr.statusCode)
    expect(notFoundErr.message).toBe(wrongOwnerErr.message)
  })

  // ─── owner reassignment ───────────────────────────────────────────────────

  it('contacts-unit-16: updateContact — sales_rep with ownerId in body throws ForbiddenError', async () => {
    vi.mocked(findById).mockResolvedValue({ ...baseContact, ownerId: repCaller.userId })

    await expect(updateContact(repCaller, 'contact-uuid-1', { ownerId: 'user-uuid-other' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(update).not.toHaveBeenCalled()
  })

  it('contacts-unit-17: updateContact — manager with ownerId in body succeeds (reassign)', async () => {
    vi.mocked(findById).mockResolvedValue(baseContact)
    vi.mocked(findUserInOrg).mockResolvedValue({ id: 'user-uuid-new-owner' })
    vi.mocked(update).mockResolvedValue({ ...baseContact, ownerId: 'user-uuid-new-owner' })

    const result = await updateContact(managerCaller, 'contact-uuid-1', { ownerId: 'user-uuid-new-owner' })

    expect(findUserInOrg).toHaveBeenCalledWith('org-uuid-1', 'user-uuid-new-owner')
    expect(result.ownerId).toBe('user-uuid-new-owner')
  })

  it('contacts-unit-17b: updateContact — manager reassign to userId not in org throws ForbiddenError', async () => {
    vi.mocked(findById).mockResolvedValue(baseContact)
    vi.mocked(findUserInOrg).mockResolvedValue(undefined)

    await expect(
      updateContact(managerCaller, 'contact-uuid-1', { ownerId: 'user-uuid-foreign-org' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(update).not.toHaveBeenCalled()
  })

  it('contacts-unit-18: deleteContact — ForbiddenError (403) for non-existent contact', async () => {
    vi.mocked(findById).mockResolvedValue(undefined)

    await expect(deleteContact(adminCaller, 'no-such-id'))
      .rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })

    expect(softDelete).not.toHaveBeenCalled()
  })

  it('contacts-unit-19: updateContact — ConflictError when updating email to one already in org', async () => {
    vi.mocked(findById).mockResolvedValue(baseContact)
    vi.mocked(findByEmail).mockResolvedValue({ ...baseContact, id: 'contact-uuid-other' })

    await expect(
      updateContact(adminCaller, 'contact-uuid-1', { email: 'taken@example.com' }),
    ).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 })

    expect(update).not.toHaveBeenCalled()
  })
})
