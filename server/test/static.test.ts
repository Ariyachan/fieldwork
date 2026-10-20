import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createApp } from '../src/app.js'

test('optional static frontend serves index and assets without replacing missing resources or API errors', async () => {
  const directory = await mkdtemp(join(dirname(fileURLToPath(import.meta.url)), '.static-test-'))
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL })
  const origin = 'http://localhost:4100'
  const secret = randomBytes(48).toString('base64url')
  try {
    await mkdir(join(directory, 'assets'))
    await writeFile(join(directory, 'index.html'), '<!doctype html><title>Fieldwork fixture</title>')
    await writeFile(join(directory, 'assets', 'app.js'), 'window.fieldworkFixture = true;')
    for (const exists of [true, false]) {
      const { app } = createApp({ pool, baseURL: origin, secret, trustedOrigins: [origin], staticDir: exists ? directory : join(directory, 'missing-directory') })
      const server = app.listen(0, '127.0.0.1')
      await once(server, 'listening')
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      try {
        const root = await fetch(base, { redirect: 'manual' })
        assert.equal(root.status, exists ? 302 : 404)
        if (exists) assert.equal(root.headers.get('location'), '/fieldwork/')
        const index = await fetch(`${base}/fieldwork/`)
        assert.equal(index.status, exists ? 200 : 404)
        if (exists) assert.match(await index.text(), /Fieldwork fixture/)
        const asset = await fetch(`${base}/fieldwork/assets/app.js`)
        assert.equal(asset.status, exists ? 200 : 404)
        if (exists) {
          assert.match(asset.headers.get('content-type') ?? '', /javascript/)
          assert.equal(await asset.text(), 'window.fieldworkFixture = true;')
        }
        const missing = await fetch(`${base}/fieldwork/assets/missing.js`)
        assert.equal(missing.status, 404)
        assert.doesNotMatch(await missing.text(), /Fieldwork fixture/)
        const protectedApi = await fetch(`${base}/api/projects`)
        assert.equal(protectedApi.status, 401)
        assert.match(protectedApi.headers.get('content-type') ?? '', /application\/json/)
      } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
      }
    }
  } finally {
    await pool.end()
    await rm(directory, { recursive: true })
  }
})
