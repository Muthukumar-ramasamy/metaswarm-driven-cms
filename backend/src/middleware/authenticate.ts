import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../lib/jwt'

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error:   'UNAUTHORIZED',
      message: 'Missing or invalid token.',
    })
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = {
      userId:         payload.sub,
      organizationId: payload.organizationId,
      role:           payload.role,
    }
  } catch {
    return reply.status(401).send({
      error:   'UNAUTHORIZED',
      message: 'Missing or invalid token.',
    })
  }
}
