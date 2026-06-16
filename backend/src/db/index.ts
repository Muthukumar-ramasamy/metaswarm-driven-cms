import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as organizationsSchema from './schema/organizations'
import * as usersSchema from './schema/users'
import * as companiesSchema from './schema/companies'
import * as contactsSchema from './schema/contacts'

const connectionString = process.env.DATABASE_URL!
const sql = neon(connectionString)

export const db = drizzle(sql, {
  schema: { ...organizationsSchema, ...usersSchema, ...companiesSchema, ...contactsSchema },
})
