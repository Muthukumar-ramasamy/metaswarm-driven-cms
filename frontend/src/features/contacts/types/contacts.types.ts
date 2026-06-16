export type ContactSource = 'website' | 'referral' | 'social_media' | 'cold_outreach' | 'event' | 'other'

export interface Contact {
  id:             string
  organizationId: string
  ownerId:        string
  createdBy:      string
  companyId:      string | null
  firstName:      string
  lastName:       string | null
  email:          string | null
  phone:          string | null
  jobTitle:       string | null
  linkedinUrl:    string | null
  source:         ContactSource | null
  createdAt:      string
  updatedAt:      string
  deletedAt:      string | null
}

export interface ContactDetail extends Contact {
  deals:      unknown[]
  activities: unknown[]
}

export interface Pagination {
  page:  number
  limit: number
  total: number
}

export interface ContactsListResponse {
  data:       Contact[]
  pagination: Pagination
}

export interface CreateContactPayload {
  firstName:    string
  lastName?:    string
  email?:       string
  phone?:       string
  jobTitle?:    string
  linkedinUrl?: string
  companyId?:   string
  source?:      ContactSource
  ownerId?:     string
}

export type UpdateContactPayload = Partial<CreateContactPayload>
