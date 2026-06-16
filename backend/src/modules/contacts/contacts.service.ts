import { AppError } from '../../lib/errors'
import * as repo from './contacts.repository'
import type { CreateContactBody, UpdateContactBody, ListContactsQuery } from './contacts.schemas'

interface Caller {
  userId:         string
  organizationId: string
  role:           'admin' | 'manager' | 'sales_rep'
}

function forbid(): never {
  throw new AppError('FORBIDDEN', 'Access denied', 403)
}

function conflict(message: string): never {
  throw new AppError('CONFLICT', message, 409)
}

export async function createContact(caller: Caller, body: CreateContactBody & { ownerId?: string }) {
  const email = body.email ? body.email.toLowerCase() : undefined
  if (email) {
    const existing = await repo.findByEmail(caller.organizationId, email)
    if (existing) conflict('A contact with this email already exists in your organisation')
  }

  // sales_rep: ownerId always forced to caller — ignore body.ownerId
  const ownerId = caller.role === 'sales_rep'
    ? caller.userId
    : (body.ownerId ?? caller.userId)

  return repo.create({
    organizationId: caller.organizationId,
    ownerId,
    createdBy:      caller.userId,
    firstName:      body.firstName,
    lastName:       body.lastName   ?? null,
    email:          email           ?? null,
    phone:          body.phone      ?? null,
    jobTitle:       body.jobTitle   ?? null,
    linkedinUrl:    body.linkedinUrl ?? null,
    companyId:      body.companyId  ?? null,
    source:         body.source,
  })
}

export async function listContacts(caller: Caller, query: ListContactsQuery) {
  const ownerId = caller.role === 'sales_rep' ? caller.userId : query.ownerId ?? undefined

  const { rows, total } = await repo.list(caller.organizationId, {
    page:      query.page,
    limit:     query.limit,
    ownerId,
    search:    query.search,
    companyId: query.companyId,
    source:    query.source,
  })

  return {
    data:       rows,
    pagination: { page: query.page, limit: query.limit, total },
  }
}

export async function getContact(caller: Caller, id: string) {
  const contact = await repo.findById(caller.organizationId, id)

  // IDOR prevention: identical 403 whether not-found or wrong owner
  if (!contact) forbid()
  if (caller.role === 'sales_rep' && contact.ownerId !== caller.userId) forbid()

  return { ...contact, deals: [], activities: [] }
}

export async function updateContact(
  caller: Caller,
  id: string,
  body: UpdateContactBody & { ownerId?: string },
) {
  const contact = await repo.findById(caller.organizationId, id)
  if (!contact) forbid()

  // sales_rep cannot reassign owner
  if (caller.role === 'sales_rep' && body.ownerId !== undefined) forbid()
  // sales_rep can only update their own contacts
  if (caller.role === 'sales_rep' && contact.ownerId !== caller.userId) forbid()

  // manager/admin reassign — validate new owner is in same org
  if (body.ownerId !== undefined && caller.role !== 'sales_rep') {
    const ownerInOrg = await repo.findUserInOrg(caller.organizationId, body.ownerId)
    if (!ownerInOrg) forbid()
  }

  // Check email uniqueness on update
  if (body.email) {
    const email = body.email.toLowerCase()
    const existing = await repo.findByEmail(caller.organizationId, email)
    if (existing && existing.id !== id) conflict('A contact with this email already exists in your organisation')
    body = { ...body, email }
  }

  return repo.update(caller.organizationId, id, body)
}

export async function deleteContact(caller: Caller, id: string) {
  // Only admin can delete
  if (caller.role !== 'admin') forbid()

  const contact = await repo.findById(caller.organizationId, id)
  if (!contact) forbid()

  return repo.softDelete(caller.organizationId, id)
}
