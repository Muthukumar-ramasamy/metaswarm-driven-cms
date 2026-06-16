import { z } from 'zod'

export const signupSchema = z.object({
  orgName:   z.string().min(1, 'Organisation name is required'),
  firstName: z.string().min(1, 'First name is required'),
  email:     z.string().email('Valid email is required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email:    z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export type SignupBody = z.infer<typeof signupSchema>
export type LoginBody  = z.infer<typeof loginSchema>
