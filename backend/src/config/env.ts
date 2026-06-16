import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL:   z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET:     z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  PORT:           z.string().default('3000'),
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
  // Phase 2 — optional for Phase 1
  SMTP_HOST:      z.string().optional(),
  SMTP_PORT:      z.string().optional(),
  SMTP_USER:      z.string().optional(),
  SMTP_PASS:      z.string().optional(),
  SMTP_FROM:      z.string().optional(),
  FRONTEND_URL:   z.string().optional(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
