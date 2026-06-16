import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from './lib/errors'
import { authRoutes } from './modules/auth/auth.routes'
import { contactsRoutes } from './modules/contacts/contacts.routes'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  await app.register(authRoutes)
  await app.register(contactsRoutes)

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error:   error.code,
        message: error.message,
        details: error.details,
      })
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error:   'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.errors,
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      error:   'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    })
  })

  return app
}
