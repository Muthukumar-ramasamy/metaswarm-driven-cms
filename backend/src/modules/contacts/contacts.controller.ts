import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './contacts.service'
import { createContactSchema, updateContactSchema, getContactSchema, listContactsSchema } from './contacts.schemas'
import { ok } from '../../lib/response'

export async function listContacts(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { query } = listContactsSchema.parse({ query: req.query })
  const result = await service.listContacts(req.user!, query)
  reply.status(200).send(result)
}

export async function createContact(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { body } = createContactSchema.parse({ body: req.body })
  const contact = await service.createContact(req.user!, body)
  reply.status(201).send(ok(contact))
}

export async function getContact(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { params } = getContactSchema.parse({ params: req.params })
  const contact = await service.getContact(req.user!, params.id)
  reply.status(200).send(ok(contact))
}

export async function updateContact(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { params, body } = updateContactSchema.parse({ params: req.params, body: req.body })
  const contact = await service.updateContact(req.user!, params.id, body)
  reply.status(200).send(ok(contact))
}

export async function deleteContact(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { params } = getContactSchema.parse({ params: req.params })
  await service.deleteContact(req.user!, params.id)
  reply.status(204).send()
}
