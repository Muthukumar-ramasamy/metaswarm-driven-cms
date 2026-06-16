import type {
  Contact,
  ContactDetail,
  ContactsListResponse,
  CreateContactPayload,
  UpdateContactPayload,
} from '../types/contacts.types'

function getToken(): string {
  return localStorage.getItem('crm_token') ?? ''
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { headers: authHeaders(), ...options })
  if (res.status === 204) return undefined as T
  const json = await res.json() as { data?: T; error?: string; message?: string; pagination?: unknown }
  if (!res.ok) throw new Error((json as { message?: string }).message ?? 'Something went wrong.')
  return json as T
}

export async function listContacts(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<ContactsListResponse> {
  const q = new URLSearchParams()
  if (params?.page)   q.set('page',   String(params.page))
  if (params?.limit)  q.set('limit',  String(params.limit))
  if (params?.search) q.set('search', params.search)
  return request<ContactsListResponse>(`/api/contacts?${q.toString()}`)
}

export async function getContact(id: string): Promise<{ data: ContactDetail }> {
  return request<{ data: ContactDetail }>(`/api/contacts/${id}`)
}

export async function createContact(payload: CreateContactPayload): Promise<{ data: Contact }> {
  return request<{ data: Contact }>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateContact(id: string, payload: UpdateContactPayload): Promise<{ data: Contact }> {
  return request<{ data: Contact }>(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteContact(id: string): Promise<void> {
  return request<void>(`/api/contacts/${id}`, { method: 'DELETE' })
}
