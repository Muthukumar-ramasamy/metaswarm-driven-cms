import { z } from 'zod'

export const contactSourceValues = ['website', 'referral', 'social_media', 'cold_outreach', 'event', 'other'] as const

export const createContactSchema = z.object({
  firstName:    z.string().min(1, 'First name is required').max(255),
  lastName:     z.string().max(255).optional(),
  email:        z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone:        z.string().max(50).optional(),
  jobTitle:     z.string().max(255).optional(),
  linkedinUrl:  z.string().url('Enter a valid URL').optional().or(z.literal('')),
  companyId:    z.string().uuid().optional(),
  source:       z.enum(contactSourceValues).optional(),
})

export const updateContactSchema = createContactSchema.partial()

export type CreateContactFormValues = z.infer<typeof createContactSchema>
export type UpdateContactFormValues = z.infer<typeof updateContactSchema>
