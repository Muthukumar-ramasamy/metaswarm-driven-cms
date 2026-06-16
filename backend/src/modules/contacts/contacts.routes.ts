import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import * as controller from './contacts.controller'

export async function contactsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate)

  app.get('/api/contacts',          controller.listContacts)
  app.post('/api/contacts',         controller.createContact)
  app.get('/api/contacts/:id',      controller.getContact)
  app.put('/api/contacts/:id',      controller.updateContact)
  app.delete('/api/contacts/:id',   controller.deleteContact)
}
