import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.test first (test-specific overrides), then fall back to .env
config({ path: resolve(process.cwd(), 'backend/.env.test'), override: false })
config({ path: resolve(process.cwd(), 'backend/.env') })
