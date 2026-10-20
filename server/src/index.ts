import { Pool } from 'pg'
import { createApp } from './app.js'
import { readConfig } from './config.js'

const config = readConfig()
const pool = new Pool({ connectionString: config.DATABASE_URL })
pool.on('error', (error) => console.error('PostgreSQL pool error:', error.message))
await pool.query('SELECT 1')
const { app } = createApp({ pool, baseURL: config.BETTER_AUTH_URL, secret: config.BETTER_AUTH_SECRET, trustedOrigins: config.trustedOrigins, staticDir: config.STATIC_DIR })
const server = app.listen(config.PORT, config.HOST, () => console.log(`Fieldwork API listening on ${config.HOST}:${config.PORT}`))
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => { void pool.end().then(() => process.exit(0)) })
  })
}
