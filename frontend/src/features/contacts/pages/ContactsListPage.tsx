import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Container, Typography, TextField,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination,
  AppBar, Toolbar, CircularProgress, Alert, Chip, Stack,
} from '@mui/material'

import { useContacts } from '../hooks/useContacts'
import { CreateEditContactDrawer } from '../components/CreateEditContactDrawer'
import { logout } from '../../auth/api/auth'

export function ContactsListPage() {
  const navigate  = useNavigate()
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const limit = 20
  const { data, isLoading, isError } = useContacts({
    page:   page + 1,
    limit,
    search: search || undefined,
  })

  const raw  = localStorage.getItem('crm_user')
  const user = raw ? (JSON.parse(raw) as { firstName: string; role: string }) : null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CRM — Contacts
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.firstName} ({user?.role})
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Dashboard</Button>
          <Button color="inherit" onClick={handleLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={600}>Contacts</Typography>
          <Button
            variant="contained"
            onClick={() => setDrawerOpen(true)}
          >
            New Contact
          </Button>
        </Stack>

        <TextField
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          size="small"
          sx={{ mb: 2, width: 320 }}
        />

        {isLoading && (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>Failed to load contacts.</Alert>
        )}

        {!isLoading && !isError && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Job Title</strong></TableCell>
                  <TableCell><strong>Source</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No contacts yet. Click "New Contact" to add one.
                    </TableCell>
                  </TableRow>
                )}
                {data?.data.map((contact) => (
                  <TableRow
                    key={contact.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <TableCell>
                      {contact.firstName}{contact.lastName ? ` ${contact.lastName}` : ''}
                    </TableCell>
                    <TableCell>{contact.email ?? '—'}</TableCell>
                    <TableCell>{contact.phone ?? '—'}</TableCell>
                    <TableCell>{contact.jobTitle ?? '—'}</TableCell>
                    <TableCell>
                      {contact.source
                        ? <Chip label={contact.source.replace('_', ' ')} size="small" />
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={data?.pagination.total ?? 0}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={limit}
              rowsPerPageOptions={[limit]}
            />
          </TableContainer>
        )}
      </Container>

      <CreateEditContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}
