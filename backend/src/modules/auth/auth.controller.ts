import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './auth.service'
import { signupSchema, loginSchema } from './auth.schemas'
import { ok } from '../../lib/response'

export async function signup(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = signupSchema.parse(req.body)
  const result = await service.signup(body)
  reply.status(201).send(ok(result))
}

export async function login(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = loginSchema.parse(req.body)
  const result = await service.login(body)
  reply.status(200).send(ok(result))
}

export async function logout(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await service.logout()
  reply.status(204).send()
}
