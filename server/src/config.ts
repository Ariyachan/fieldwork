import { z } from 'zod'

const environment = z.object({
  DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:/.test(value), 'Use a PostgreSQL URL'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  TRUSTED_ORIGINS: z.string().min(1),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  STATIC_DIR: z.string().min(1).default('../dist'),
})

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = environment.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid server configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`)
  }
  const trustedOrigins = result.data.TRUSTED_ORIGINS.split(',').map((value) => z.url().parse(value.trim()))
  return { ...result.data, trustedOrigins }
}
