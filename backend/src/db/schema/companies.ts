import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const companies = pgTable('companies', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name:           varchar('name', { length: 255 }).notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  orgIdx: index('companies_org_idx').on(t.organizationId),
}))
