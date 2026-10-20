import { pathToFileURL } from 'node:url'
import { Pool } from 'pg'
import { getMigrations } from 'better-auth/db/migration'
import { createAuth, type Auth } from './auth.js'
import { readConfig } from './config.js'
import { migrateWorkspace } from './store.js'

export async function migrate(pool: Pool, auth: Auth) {
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  await migrateWorkspace(pool)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = readConfig()
  const pool = new Pool({ connectionString: config.DATABASE_URL })
  try {
    await migrate(pool, createAuth(pool, config.BETTER_AUTH_URL, config.BETTER_AUTH_SECRET, config.trustedOrigins))
    console.log('Better Auth and Fieldwork PostgreSQL migrations are current.')
  } finally {
    await pool.end()
  }
}
