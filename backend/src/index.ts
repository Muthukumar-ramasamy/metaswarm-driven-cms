import './load-env'  // must be first: sets process.env before config/env.ts evaluates
import { env } from './config/env'
import { buildApp } from './app'

const app = await buildApp()

await app.listen({
  port: Number(env.PORT),
  host: '0.0.0.0',
})
