import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import test from 'node:test'
import { Pool } from 'pg'
import { createApp } from '../src/app.js'
import { migrate } from '../src/migrate.js'

test('real HTTP authentication and PostgreSQL workspace lifecycle', { timeout: 90000 }, async (suite) => {
  const connectionString = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  assert.ok(connectionString, 'Set TEST_DATABASE_URL or DATABASE_URL to an actual PostgreSQL database')
  const secret = randomBytes(48).toString('base64url')
  const origin = 'http://localhost:4100'
  let pool = new Pool({ connectionString })
  let server: Server
  let address: string
  const users: string[] = []

  async function start() {
    const { app, auth } = createApp({ pool, baseURL: origin, secret, trustedOrigins: [origin] })
    await migrate(pool, auth)
    server = app.listen(0, '127.0.0.1')
    await once(server, 'listening')
    address = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  }
  async function stop() {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await pool.end()
  }
  function client() {
    const cookies = new Map<string, string>()
    return {
      async request(path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) {
        const response = await fetch(`${address}${path}`, {
          method,
          headers: { Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; '), ...extra },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        })
        for (const cookie of response.headers.getSetCookie()) {
          const [pair] = cookie.split(';')
          const separator = pair.indexOf('=')
          cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
        }
        return { status: response.status, body: await response.json() }
      },
    }
  }

  await start()
  const anonymous = client()
  const alice = client()
  const bob = client()
  const suffix = randomBytes(8).toString('hex')
  const email = `alice-${suffix}@example.test`
  const password = randomBytes(24).toString('base64url')
  let aliceId = ''
  let original: any
  let current: any

  try {
    await suite.test('health probes PostgreSQL; business endpoints reject unauthenticated access', async () => {
      assert.deepEqual((await anonymous.request('/api/health')).body, { status: 'ok' })
      for (const [path, method] of [['/api/workspace', 'GET'], ['/api/workspace', 'PUT'], ['/api/projects', 'GET'], ['/api/projects', 'POST'], ['/api/projects/courtyard', 'GET'], ['/api/projects/courtyard', 'PATCH'], ['/api/projects/courtyard', 'DELETE']]) {
        assert.equal((await anonymous.request(path, method)).status, 401, `${method} ${path}`)
      }
    })

    await suite.test('register two real users with Better Auth and seed their isolated workspaces', async () => {
      const signup = await alice.request('/api/auth/sign-up/email', 'POST', { name: 'Alice', email, password })
      assert.equal(signup.status, 200)
      aliceId = signup.body.user.id
      users.push(aliceId)
      const second = await bob.request('/api/auth/sign-up/email', 'POST', { name: 'Bob', email: `bob-${suffix}@example.test`, password })
      assert.equal(second.status, 200)
      users.push(second.body.user.id)
      const initial = await alice.request('/api/workspace')
      assert.equal(initial.status, 200)
      original = initial.body
      assert.equal(original.workspace.projects.length, 4)
      assert.equal(original.revision, 0)
      assert.deepEqual((await bob.request('/api/workspace')).body, original)
      const stored = await pool.query('SELECT password FROM account WHERE "userId" = $1', [aliceId])
      assert.equal(stored.rows.length, 1)
      assert.notEqual(stored.rows[0].password, password)
    })

    await suite.test('project create/read/update/delete operates on the same snapshot and isolates users', async () => {
      const project = { ...original.workspace.projects[0], id: `private-${suffix}`, name: 'Alice only' }
      const created = await alice.request('/api/projects', 'POST', project)
      assert.equal(created.status, 201)
      assert.equal(created.body.revision, 1)
      assert.equal((await alice.request(`/api/projects/${project.id}`)).body.project.name, 'Alice only')
      assert.equal((await bob.request(`/api/projects/${project.id}`)).status, 404)
      assert.equal((await bob.request(`/api/projects/${project.id}`, 'PATCH', { name: 'Intrusion' })).status, 404)
      assert.equal((await alice.request('/api/projects', 'POST', project)).status, 409)
      assert.equal((await alice.request(`/api/projects/${project.id}`, 'PATCH', { name: 'Revised studio' })).status, 200)
      assert.equal((await alice.request('/api/workspace')).body.workspace.projects.at(-1).name, 'Revised studio')
      assert.equal((await alice.request('/api/projects')).body.projects.length, 5)
      assert.equal((await alice.request(`/api/projects/${project.id}`, 'DELETE')).status, 200)
      assert.equal((await alice.request(`/api/projects/${project.id}`)).status, 404)
      assert.deepEqual((await bob.request('/api/workspace')).body, original)
      current = (await alice.request('/api/workspace')).body
      assert.equal(current.revision, 3)
    })

    await suite.test('invalid types, references, duplicate IDs and oversized fields leave stored data untouched', async () => {
      const invalids = [
        (workspace: any) => { workspace.tasks[0].projectId = 'missing-project' },
        (workspace: any) => { workspace.projects.push(structuredClone(workspace.projects[0])) },
        (workspace: any) => { workspace.reviews[0].notes[0].x = 101 },
        (workspace: any) => { workspace.tasks[0].status = 'Unknown' },
        (workspace: any) => { workspace.projects[0].due = '2026-02-30' },
        (workspace: any) => { workspace.projects[0].name = 'a'.repeat(201) },
        (workspace: any) => { workspace.projects[0].id = '../invalid' },
        (workspace: any) => { workspace.reviews[0].notes.push(structuredClone(workspace.reviews[0].notes[0])) },
        (workspace: any) => { workspace.tasks[0].assignee = 'unknown' },
        (workspace: any) => { workspace.reviews[0].notes[0].author = 'unknown' },
        (workspace: any) => { workspace.reviews[0].status = 'Approved' },
      ]
      for (const invalidate of invalids) {
        const workspace = structuredClone(current.workspace)
        invalidate(workspace)
        assert.equal((await alice.request('/api/workspace', 'PUT', { workspace, revision: current.revision })).status, 400)
      }
      assert.equal((await alice.request('/api/workspace', 'PUT', { ...current, userId: users[1] })).status, 400)
      assert.equal((await alice.request('/api/projects/courtyard', 'PATCH', { id: 'new-identity' })).status, 400)
      assert.equal((await alice.request('/api/projects/courtyard', 'PATCH', { name: 'Bad origin' }, { Origin: 'https://untrusted.example' })).status, 403)
      assert.deepEqual((await alice.request('/api/workspace')).body, current)
    })

    await suite.test('concurrent writes allow one winner; stale revision is409 and cannot overwrite', async () => {
      const first = structuredClone(current)
      const second = structuredClone(current)
      first.workspace.projects[0].name = 'Concurrent A'
      second.workspace.projects[0].name = 'Concurrent B'
      const results = await Promise.all([alice.request('/api/workspace', 'PUT', first), alice.request('/api/workspace', 'PUT', second)])
      assert.deepEqual(results.map((result) => result.status).sort(), [200, 409])
      current = (await alice.request('/api/workspace')).body
      assert.equal(current.revision, 4)
      assert.equal((await alice.request('/api/workspace', 'PUT', first)).status, 409)
      assert.deepEqual((await alice.request('/api/workspace')).body, current)
      assert.deepEqual((await bob.request('/api/workspace')).body, original)
    })

    await suite.test('logout revokes session, wrong password fails, and login restores the existing data', async () => {
      assert.equal((await alice.request('/api/auth/sign-out', 'POST', {})).status, 200)
      assert.equal((await alice.request('/api/workspace')).status, 401)
      assert.equal((await alice.request('/api/auth/sign-in/email', 'POST', { email, password: 'incorrect-long-password' })).status, 401)
      assert.equal((await alice.request('/api/auth/sign-in/email', 'POST', { email, password })).status, 200)
      assert.deepEqual((await alice.request('/api/workspace')).body, current)
    })

    await suite.test('a fresh server and PostgreSQL pool retain users, session and workspace', async () => {
      await stop()
      pool = new Pool({ connectionString })
      await start()
      assert.deepEqual((await alice.request('/api/workspace')).body, current)
      const persisted = await pool.query('SELECT snapshot, revision FROM workspaces WHERE user_id = $1', [aliceId])
      assert.equal(persisted.rows[0].revision, 4)
      assert.deepEqual(persisted.rows[0].snapshot, current.workspace)
      assert.deepEqual((await bob.request('/api/workspace')).body, original)
    })
  } finally {
    if (users.length) await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [users])
    await stop()
  }
})
