import { config } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Always resolve relative to THIS file (backend/src/), not process.cwd()
// This makes .env loading CWD-independent regardless of how npm is invoked.
const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dir, '..', '.env') })  // backend/src/../.env → backend/.env
