import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  sub: string
  organizationId: string
  role: 'admin' | 'manager' | 'sales_rep'
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
