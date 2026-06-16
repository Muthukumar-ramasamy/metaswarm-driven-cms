import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/contacts.api'
import type { CreateContactPayload, UpdateContactPayload } from '../types/contacts.types'

const CONTACTS_KEY = 'contacts'

export function useContacts(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [CONTACTS_KEY, params],
    queryFn:  () => api.listContacts(params),
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: [CONTACTS_KEY, id],
    queryFn:  () => api.getContact(id),
    enabled:  !!id,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateContactPayload) => api.createContact(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  })
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateContactPayload) => api.updateContact(id, payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: [CONTACTS_KEY] })
      qc.invalidateQueries({ queryKey: [CONTACTS_KEY, id] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [CONTACTS_KEY] }),
  })
}
