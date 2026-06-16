import { z } from 'zod'

const contactSourceEnum = z.enum(['website', 'referral', 'social_media', 'cold_outreach', 'event', 'other'])

const baseContactFields = {
  firstName:   z.string().min(1, 'First name is required').max(255),
  lastName:    z.string().max(255).optional(),
  email:       z.string().email('Valid email required').max(255).optional(),
  phone:       z.string().max(50).optional(),
  jobTitle:    z.string().max(255).optional(),
  linkedinUrl: z.string().url('Valid URL required').max(500).optional(),
  companyId:   z.string().uuid('companyId must be a UUID').optional(),
  source:      contactSourceEnum.optional(),
  ownerId:     z.string().uuid('ownerId must be a UUID').optional(),
}

export const createContactSchema = z.object({
  body: z.object(baseContactFields),
})

export const updateContactSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    ...baseContactFields,
    firstName: z.string().min(1).max(255).optional(),
  }),
})

export const getContactSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
})

export const listContactsSchema = z.object({
  query: z.object({
    page:      z.coerce.number().int().positive().default(1),
    limit:     z.coerce.number().int().positive().max(100).default(20),
    search:    z.string().optional(),
    companyId: z.string().uuid().optional(),
    source:    contactSourceEnum.optional(),
  }),
})

export type CreateContactBody = z.infer<typeof createContactSchema>['body']
export type UpdateContactBody = z.infer<typeof updateContactSchema>['body']
export type ListContactsQuery = z.infer<typeof listContactsSchema>['query']
