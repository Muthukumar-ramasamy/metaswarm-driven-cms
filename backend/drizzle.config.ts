import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
} satisfies Config
