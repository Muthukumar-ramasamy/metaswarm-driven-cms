import { and, count, eq, ilike, isNull, SQL } from 'drizzle-orm'
import { db } from '../../db/index'
import { contacts } from '../../db/schema/contacts'
import { users } from '../../db/schema/users'

export type ContactRow = typeof contacts.$inferSelect

export interface CreateContactInput {
  organizationId: string
  ownerId:        string
  createdBy:      string
  firstName:      string
  lastName?:      string | null
  email?:         string | null
  phone?:         string | null
  jobTitle?:      string | null
  linkedinUrl?:   string | null
  companyId?:     string | null
  source?:        'website' | 'referral' | 'social_media' | 'cold_outreach' | 'event' | 'other'
}

export interface UpdateContactInput {
  firstName?:   string
  lastName?:    string
  email?:       string
  phone?:       string
  jobTitle?:    string
  linkedinUrl?: string
  companyId?:   string
  ownerId?:     string
  source?:      'website' | 'referral' | 'social_media' | 'cold_outreach' | 'event' | 'other'
}

export interface ListContactsInput {
  page:      number
  limit:     number
  ownerId?:  string
  search?:   string
  companyId?: string
  source?:   'website' | 'referral' | 'social_media' | 'cold_outreach' | 'event' | 'other'
}

export async function findByEmail(
  organizationId: string,
  email: string,
): Promise<ContactRow | undefined> {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      eq(contacts.email, email),
      isNull(contacts.deletedAt),
    ))
    .limit(1)
  return row
}

export async function findById(
  organizationId: string,
  id: string,
): Promise<ContactRow | undefined> {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(
      eq(contacts.id, id),
      eq(contacts.organizationId, organizationId),
      isNull(contacts.deletedAt),
    ))
    .limit(1)
  return row
}

export async function findUserInOrg(
  organizationId: string,
  userId: string,
): Promise<{ id: string } | undefined> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(
      eq(users.id, userId),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt),
    ))
    .limit(1)
  return row
}

export async function create(input: CreateContactInput): Promise<ContactRow> {
  const [row] = await db
    .insert(contacts)
    .values({
      organizationId: input.organizationId,
      ownerId:        input.ownerId,
      createdBy:      input.createdBy,
      firstName:      input.firstName,
      lastName:       input.lastName,
      email:          input.email,
      phone:          input.phone,
      jobTitle:       input.jobTitle,
      linkedinUrl:    input.linkedinUrl,
      companyId:      input.companyId,
      source:         input.source,
    })
    .returning()
  return row
}

export async function list(
  organizationId: string,
  input: ListContactsInput,
): Promise<{ rows: ContactRow[]; total: number }> {
  const conditions: SQL[] = [
    eq(contacts.organizationId, organizationId),
    isNull(contacts.deletedAt),
  ]
  if (input.ownerId)   conditions.push(eq(contacts.ownerId, input.ownerId))
  if (input.companyId) conditions.push(eq(contacts.companyId, input.companyId))
  if (input.source)    conditions.push(eq(contacts.source, input.source))
  if (input.search) {
    conditions.push(ilike(contacts.firstName, `%${input.search}%`))
  }

  const where = and(...conditions)
  const offset = (input.page - 1) * input.limit

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(contacts).where(where).limit(input.limit).offset(offset),
    db.select({ value: count() }).from(contacts).where(where),
  ])

  return { rows, total: Number(total) }
}

export async function update(
  organizationId: string,
  id: string,
  input: UpdateContactInput,
): Promise<ContactRow> {
  const [row] = await db
    .update(contacts)
    .set({ ...input, updatedAt: new Date() })
    .where(and(
      eq(contacts.id, id),
      eq(contacts.organizationId, organizationId),
      isNull(contacts.deletedAt),
    ))
    .returning()
  return row
}

export async function softDelete(
  organizationId: string,
  id: string,
): Promise<ContactRow | undefined> {
  const [row] = await db
    .update(contacts)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(contacts.id, id),
      eq(contacts.organizationId, organizationId),
      isNull(contacts.deletedAt),
    ))
    .returning()
  return row
}
