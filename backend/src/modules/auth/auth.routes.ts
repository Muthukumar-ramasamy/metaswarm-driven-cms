import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import * as controller from './auth.controller'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/signup', controller.signup)
  app.post('/api/auth/login',  controller.login)
  app.post('/api/auth/logout', { onRequest: [authenticate] }, controller.logout)
}
