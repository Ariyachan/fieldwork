import { readFile } from 'node:fs/promises'
import type { Pool, PoolClient } from 'pg'
import { workspaceSchema, type Workspace } from './schema.js'

const seed = workspaceSchema.parse(JSON.parse(await readFile(new URL('../seed.json', import.meta.url), 'utf8')))
export type Snapshot = { workspace: Workspace; revision: number }

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function migrateWorkspace(pool: Pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS workspaces (
    user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

async function initialize(client: Pool | PoolClient, userId: string) {
  await client.query('INSERT INTO workspaces(user_id, snapshot) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO NOTHING', [userId, JSON.stringify(seed)])
}

export async function readWorkspace(pool: Pool, userId: string): Promise<Snapshot> {
  await initialize(pool, userId)
  const result = await pool.query('SELECT snapshot AS workspace, revision FROM workspaces WHERE user_id = $1', [userId])
  return result.rows[0]
}

export async function replaceWorkspace(pool: Pool, userId: string, workspace: Workspace, revision: number): Promise<Snapshot> {
  await initialize(pool, userId)
  const result = await pool.query(`UPDATE workspaces SET snapshot = $2::jsonb, revision = revision + 1, updated_at = NOW()
    WHERE user_id = $1 AND revision = $3 RETURNING snapshot AS workspace, revision`, [userId, JSON.stringify(workspace), revision])
  if (!result.rowCount) throw new HttpError(409, 'Workspace changed. Reload before saving again.')
  return result.rows[0]
}

export async function changeProjects(pool: Pool, userId: string, change: (workspace: Workspace) => void): Promise<Snapshot> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await initialize(client, userId)
    const current = await client.query('SELECT snapshot FROM workspaces WHERE user_id = $1 FOR UPDATE', [userId])
    const workspace = workspaceSchema.parse(current.rows[0].snapshot)
    change(workspace)
    workspaceSchema.parse(workspace)
    const result = await client.query(`UPDATE workspaces SET snapshot = $2::jsonb, revision = revision + 1, updated_at = NOW()
      WHERE user_id = $1 RETURNING snapshot AS workspace, revision`, [userId, JSON.stringify(workspace)])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
