import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Typography, Container,
  Paper, AppBar, Toolbar, Grid,
} from '@mui/material'
import { logout } from '../api/auth'

const modules = [
  { label: 'Contacts', path: '/contacts', description: 'Manage your contacts' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const raw = localStorage.getItem('crm_user')
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
            CRM
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.firstName} ({user?.role})
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Welcome, {user?.firstName ?? 'there'}!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Signed in as <strong>{user?.role}</strong>
          </Typography>

          <Grid container spacing={2}>
            {modules.map((m) => (
              <Grid item xs={12} sm={6} md={4} key={m.path}>
                <Paper
                  sx={{ p: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                  onClick={() => navigate(m.path)}
                >
                  <Typography variant="h6" fontWeight={600}>{m.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{m.description}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  )
}
