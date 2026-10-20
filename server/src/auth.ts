import { betterAuth } from 'better-auth'
import type { Pool } from 'pg'

export function createAuth(pool: Pool, baseURL: string, secret: string, trustedOrigins: string[]) {
  if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters')
  return betterAuth({
    database: pool,
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
  })
}

export type Auth = ReturnType<typeof createAuth>
