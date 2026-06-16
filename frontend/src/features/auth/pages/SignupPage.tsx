import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Button, TextField, Typography, Container,
  Paper, Alert, CircularProgress,
} from '@mui/material'
import { signup } from '../api/auth'

const schema = z.object({
  orgName:   z.string().min(1, 'Organisation name is required'),
  firstName: z.string().min(1, 'First name is required'),
  email:     z.string().email('Valid email is required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setError('')
      const result = await signup(data)
      localStorage.setItem('crm_token', result.token)
      localStorage.setItem('crm_user', JSON.stringify(result.user))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Create your workspace
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Organisation name"
              fullWidth margin="normal"
              {...register('orgName')}
              error={!!errors.orgName}
              helperText={errors.orgName?.message}
            />
            <TextField
              label="Your first name"
              fullWidth margin="normal"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Create workspace'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
