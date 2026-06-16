import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/index'
import { organizations } from '../../db/schema/organizations'
import { users } from '../../db/schema/users'

export interface CreateOrganizationInput {
  name: string
  slug: string
}

export interface CreateUserInput {
  organizationId: string
  firstName: string
  lastName?: string
  email: string
  passwordHash: string
  role: 'admin' | 'manager' | 'sales_rep'
  status: 'active' | 'pending' | 'deactivated'
}

export interface UserRecord {
  id: string
  organizationId: string
  firstName: string
  email: string
  passwordHash: string
  role: 'admin' | 'manager' | 'sales_rep'
  status: 'active' | 'pending' | 'deactivated'
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<{ id: string; name: string; slug: string }> {
  const [org] = await db
    .insert(organizations)
    .values({ name: input.name, slug: input.slug })
    .returning({ id: organizations.id, name: organizations.name, slug: organizations.slug })
  return org
}

export async function createUser(
  input: CreateUserInput,
): Promise<{ id: string }> {
  const [user] = await db
    .insert(users)
    .values({
      organizationId: input.organizationId,
      firstName:      input.firstName,
      lastName:       input.lastName,
      email:          input.email,
      passwordHash:   input.passwordHash,
      role:           input.role,
      status:         input.status,
    })
    .returning({ id: users.id })
  return user
}

export async function findUserByEmailGlobal(
  email: string,
): Promise<UserRecord | undefined> {
  const [user] = await db
    .select({
      id:             users.id,
      organizationId: users.organizationId,
      firstName:      users.firstName,
      email:          users.email,
      passwordHash:   users.passwordHash,
      role:           users.role,
      status:         users.status,
    })
    .from(users)
    .where(and(
      eq(users.email, email),
      isNull(users.deletedAt),
    ))
    .limit(1)
  return user
}
