import { pgTable, pgEnum, uuid, varchar, timestamp, index, text } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'
import { companies } from './companies'

export const contactSourceEnum = pgEnum('contact_source', [
  'website',
  'referral',
  'social_media',
  'cold_outreach',
  'event',
  'other',
])

export const contacts = pgTable('contacts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  ownerId:        uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdBy:      uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  companyId:      uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  firstName:      varchar('first_name', { length: 255 }).notNull(),
  lastName:       varchar('last_name', { length: 255 }),
  email:          varchar('email', { length: 255 }),
  phone:          varchar('phone', { length: 50 }),
  jobTitle:       varchar('job_title', { length: 255 }),
  linkedinUrl:    varchar('linkedin_url', { length: 500 }),
  source:         contactSourceEnum('source'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  orgIdx:     index('contacts_org_idx').on(t.organizationId),
  ownerIdx:   index('contacts_owner_idx').on(t.ownerId),
  companyIdx: index('contacts_company_idx').on(t.companyId),
  deletedIdx: index('contacts_deleted_at_idx').on(t.deletedAt),
  emailOrgIdx: index('contacts_email_org_idx').on(t.organizationId, t.email),
}))
