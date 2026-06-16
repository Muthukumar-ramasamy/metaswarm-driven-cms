import {
  Drawer, Box, Typography, TextField, Button,
  MenuItem, Stack, IconButton, Divider,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { createContactSchema, contactSourceValues, type CreateContactFormValues } from '../schemas/contacts.schemas'
import { useCreateContact, useUpdateContact } from '../hooks/useContacts'
import type { Contact } from '../types/contacts.types'

interface Props {
  open:     boolean
  onClose:  () => void
  contact?: Contact
}

const SOURCE_LABELS: Record<string, string> = {
  website:       'Website',
  referral:      'Referral',
  social_media:  'Social Media',
  cold_outreach: 'Cold Outreach',
  event:         'Event',
  other:         'Other',
}

export function CreateEditContactDrawer({ open, onClose, contact }: Props) {
  const isEdit = !!contact
  const create = useCreateContact()
  const update = useUpdateContact(contact?.id ?? '')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactFormValues>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      firstName:   '',
      lastName:    '',
      email:       '',
      phone:       '',
      jobTitle:    '',
      linkedinUrl: '',
      source:      undefined,
    },
  })

  useEffect(() => {
    if (open) {
      reset(contact
        ? {
            firstName:   contact.firstName,
            lastName:    contact.lastName  ?? '',
            email:       contact.email     ?? '',
            phone:       contact.phone     ?? '',
            jobTitle:    contact.jobTitle  ?? '',
            linkedinUrl: contact.linkedinUrl ?? '',
            source:      contact.source    ?? undefined,
          }
        : {
            firstName: '', lastName: '', email: '',
            phone: '', jobTitle: '', linkedinUrl: '', source: undefined,
          },
      )
    }
  }, [open, contact, reset])

  const onSubmit = async (values: CreateContactFormValues) => {
    const payload = {
      ...values,
      email:       values.email       || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      lastName:    values.lastName    || undefined,
      phone:       values.phone       || undefined,
      jobTitle:    values.jobTitle    || undefined,
    }
    if (isEdit) {
      await update.mutateAsync(payload)
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            {isEdit ? 'Edit Contact' : 'New Contact'}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            ✕
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name *"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Last Name" fullWidth size="small" />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Phone" fullWidth size="small" />
              )}
            />

            <Controller
              name="jobTitle"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Job Title" fullWidth size="small" />
              )}
            />

            <Controller
              name="linkedinUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="LinkedIn URL"
                  error={!!errors.linkedinUrl}
                  helperText={errors.linkedinUrl?.message}
                  fullWidth
                  size="small"
                />
              )}
            />

            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Source"
                  fullWidth
                  size="small"
                  value={field.value ?? ''}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {contactSourceValues.map((s) => (
                    <MenuItem key={s} value={s}>{SOURCE_LABELS[s]}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" pt={1}>
              <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isEdit ? 'Save Changes' : 'Create Contact'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Drawer>
  )
}
