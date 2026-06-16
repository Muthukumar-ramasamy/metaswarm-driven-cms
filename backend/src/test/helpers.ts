import { signToken } from '../lib/jwt'

export function createTestToken(user: {
  userId: string
  organizationId: string
  role: 'admin' | 'manager' | 'sales_rep'
}): string {
  return signToken({
    sub: user.userId,
    organizationId: user.organizationId,
    role: user.role,
  })
}
