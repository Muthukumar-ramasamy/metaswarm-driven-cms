import { AppError } from '../../lib/errors'
import { signToken } from '../../lib/jwt'
import { hashPassword, verifyPassword } from '../../lib/password'
import {
  createOrganization,
  createUser,
  findUserByEmailGlobal,
} from './auth.repository'

export interface SignupInput {
  orgName: string
  firstName: string
  email: string
  password: string
}

export interface SignupResult {
  token: string
  user: {
    id: string
    role: string
    firstName: string
  }
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: string
    firstName: string
    role: string
    organizationId: string
  }
}

function generateSlug(orgName: string): string {
  return orgName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function signup(input: SignupInput): Promise<SignupResult> {
  const existing = await findUserByEmailGlobal(input.email)
  if (existing) {
    throw new AppError('CONFLICT', 'A user with this email already exists.', 409)
  }

  const slug = generateSlug(input.orgName)
  const org = await createOrganization({ name: input.orgName, slug })

  const passwordHash = await hashPassword(input.password)
  const user = await createUser({
    organizationId: org.id,
    firstName:      input.firstName,
    email:          input.email,
    passwordHash,
    role:           'admin',
    status:         'active',
  })

  const token = signToken({
    sub:            user.id,
    organizationId: org.id,
    role:           'admin',
  })

  return {
    token,
    user: {
      id:        user.id,
      role:      'admin',
      firstName: input.firstName,
    },
  }
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await findUserByEmailGlobal(input.email)
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401)
  }

  if (user.status === 'deactivated') {
    throw new AppError('FORBIDDEN', 'Your account has been deactivated. Contact your admin.', 403)
  }

  if (user.status === 'pending') {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401)
  }

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401)
  }

  const token = signToken({
    sub:            user.id,
    organizationId: user.organizationId,
    role:           user.role,
  })

  return {
    token,
    user: {
      id:             user.id,
      firstName:      user.firstName,
      role:           user.role,
      organizationId: user.organizationId,
    },
  }
}

export async function logout(): Promise<void> {
  // Stateless JWT — client discards token. No server-side action needed.
}
