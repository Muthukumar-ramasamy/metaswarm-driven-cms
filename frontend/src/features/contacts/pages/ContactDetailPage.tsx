import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Button, Container, Typography, Paper,
  AppBar, Toolbar, Stack, Chip, Divider,
  Tab, Tabs, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'

import { useContact, useDeleteContact } from '../hooks/useContacts'
import { CreateEditContactDrawer } from '../components/CreateEditContactDrawer'
import { logout } from '../../auth/api/auth'

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack direction="row" spacing={2} py={1}>
      <Typography color="text.secondary" sx={{ minWidth: 120 }}>{label}</Typography>
      <Typography>{value ?? '—'}</Typography>
    </Stack>
  )
}

export function ContactDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab]           = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data, isLoading, isError } = useContact(id!)
  const deleteContact = useDeleteContact()

  const raw  = localStorage.getItem('crm_user')
  const user = raw ? (JSON.parse(raw) as { firstName: string; role: string }) : null
  const isAdmin = user?.role === 'admin'

  const contact = data?.data

  const handleDelete = async () => {
    await deleteContact.mutateAsync(id!)
    navigate('/contacts')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CRM — Contact Detail
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.firstName} ({user?.role})
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Dashboard</Button>
          <Button color="inherit" onClick={handleLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Button
          onClick={() => navigate('/contacts')}
          sx={{ mb: 2 }}
        >
          Back to Contacts
        </Button>

        {isLoading && (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error">Contact not found or access denied.</Alert>
        )}

        {contact && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {contact.firstName}{contact.lastName ? ` ${contact.lastName}` : ''}
                  </Typography>
                  {contact.jobTitle && (
                    <Typography color="text.secondary">{contact.jobTitle}</Typography>
                  )}
                  {contact.source && (
                    <Chip
                      label={contact.source.replace('_', ' ')}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => setEditOpen(true)}
                    size="small"
                  >
                    Edit
                  </Button>
                  {/* Delete button HIDDEN for non-admin — per spec BR-04 */}
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteOpen(true)}
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <InfoRow label="Email"    value={contact.email} />
              <InfoRow label="Phone"    value={contact.phone} />
              <InfoRow label="LinkedIn" value={contact.linkedinUrl} />
            </Paper>

            <Paper sx={{ p: 0, overflow: 'hidden' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Deals" />
                <Tab label="Activities" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tab === 0 && (
                  <Typography color="text.secondary" align="center" py={4}>
                    No deals linked to this contact yet.
                  </Typography>
                )}
                {tab === 1 && (
                  <Typography color="text.secondary" align="center" py={4}>
                    No activities linked to this contact yet.
                  </Typography>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Container>

      {contact && (
        <CreateEditContactDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          contact={contact}
        />
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{contact?.firstName} {contact?.lastName}</strong>?
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteContact.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
