import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../auth.repository', () => ({
  findUserByEmailGlobal: vi.fn(),
  createOrganization:    vi.fn(),
  createUser:            vi.fn(),
}))

vi.mock('../../../lib/password', () => ({
  hashPassword:   vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('../../../lib/jwt', () => ({
  signToken: vi.fn(),
}))

import { signup, login, logout } from '../auth.service'
import { findUserByEmailGlobal, createOrganization, createUser } from '../auth.repository'
import { hashPassword, verifyPassword } from '../../../lib/password'
import { signToken } from '../../../lib/jwt'
import type { UserRecord } from '../auth.repository'

const baseUser: UserRecord = {
  id:             'user-uuid-1',
  organizationId: 'org-uuid-1',
  firstName:      'Alice',
  email:          'alice@example.com',
  passwordHash:   'hashed-pw',
  role:           'admin',
  status:         'active',
}

const signupInput = {
  orgName:   'Acme Corp',
  firstName: 'Alice',
  email:     'alice@example.com',
  password:  'secret123',
}

const loginInput = {
  email:    'alice@example.com',
  password: 'secret123',
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── signup ───────────────────────────────────────────────────────────────

  it('auth-unit-01: signup throws CONFLICT 409 when email already exists', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(baseUser)

    await expect(signup(signupInput)).rejects.toMatchObject({
      code:       'CONFLICT',
      statusCode: 409,
    })
    expect(createOrganization).not.toHaveBeenCalled()
  })

  it('auth-unit-02: signup happy path creates org + admin user and returns token', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(undefined)
    vi.mocked(createOrganization).mockResolvedValue({ id: 'org-uuid-1', name: 'Acme Corp', slug: 'acme-corp' })
    vi.mocked(hashPassword).mockResolvedValue('hashed-pw')
    vi.mocked(createUser).mockResolvedValue({ id: 'user-uuid-1' })
    vi.mocked(signToken).mockReturnValue('jwt-token')

    const result = await signup(signupInput)

    expect(result.token).toBe('jwt-token')
    expect(result.user).toMatchObject({ id: 'user-uuid-1', role: 'admin', firstName: 'Alice' })
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', status: 'active', organizationId: 'org-uuid-1' }),
    )
    expect(signToken).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', organizationId: 'org-uuid-1' }),
    )
  })

  it('auth-unit-03: signup response does not expose passwordHash', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(undefined)
    vi.mocked(createOrganization).mockResolvedValue({ id: 'org-uuid-1', name: 'Acme Corp', slug: 'acme-corp' })
    vi.mocked(hashPassword).mockResolvedValue('hashed-pw')
    vi.mocked(createUser).mockResolvedValue({ id: 'user-uuid-1' })
    vi.mocked(signToken).mockReturnValue('jwt-token')

    const result = await signup(signupInput)

    expect(result.user).not.toHaveProperty('passwordHash')
  })

  // ─── login ────────────────────────────────────────────────────────────────

  it('auth-unit-04: login throws UNAUTHORIZED 401 when email not found', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(undefined)

    await expect(login(loginInput)).rejects.toMatchObject({
      code:       'UNAUTHORIZED',
      statusCode: 401,
    })
  })

  it('auth-unit-05: login throws FORBIDDEN 403 for deactivated account before password check', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue({ ...baseUser, status: 'deactivated' })

    await expect(login(loginInput)).rejects.toMatchObject({
      code:       'FORBIDDEN',
      statusCode: 403,
    })
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it('auth-unit-06: login throws UNAUTHORIZED 401 for pending account', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue({ ...baseUser, status: 'pending' })

    await expect(login(loginInput)).rejects.toMatchObject({
      code:       'UNAUTHORIZED',
      statusCode: 401,
    })
  })

  it('auth-unit-07: login throws UNAUTHORIZED 401 for wrong password', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(baseUser)
    vi.mocked(verifyPassword).mockResolvedValue(false)

    await expect(login(loginInput)).rejects.toMatchObject({
      code:       'UNAUTHORIZED',
      statusCode: 401,
    })
  })

  it('auth-unit-08: login happy path returns token and full user object', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(baseUser)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(signToken).mockReturnValue('jwt-token')

    const result = await login(loginInput)

    expect(result.token).toBe('jwt-token')
    expect(result.user).toMatchObject({
      id:             'user-uuid-1',
      firstName:      'Alice',
      role:           'admin',
      organizationId: 'org-uuid-1',
    })
  })

  it('auth-unit-09: login response does not expose passwordHash', async () => {
    vi.mocked(findUserByEmailGlobal).mockResolvedValue(baseUser)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(signToken).mockReturnValue('jwt-token')

    const result = await login(loginInput)

    expect(result.user).not.toHaveProperty('passwordHash')
  })

  // ─── logout ───────────────────────────────────────────────────────────────

  it('auth-unit-10: logout is a no-op and returns undefined', async () => {
    const result = await logout()
    expect(result).toBeUndefined()
  })
})
