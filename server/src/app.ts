import express, { type ErrorRequestHandler } from 'express'
import cors from 'cors'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import type { Pool } from 'pg'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { ZodError } from 'zod'
import { createAuth } from './auth.js'
import { projectIdSchema, projectPatchSchema, projectSchema, workspaceWriteSchema } from './schema.js'
import { changeProjects, HttpError, readWorkspace, replaceWorkspace } from './store.js'

export function createApp(options: { pool: Pool; baseURL: string; secret: string; trustedOrigins: string[]; staticDir?: string }) {
  const { pool, baseURL, secret, trustedOrigins } = options
  const auth = createAuth(pool, baseURL, secret, trustedOrigins)
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: trustedOrigins, credentials: true }))
  app.all('/api/auth/*splat', toNodeHandler(auth))
  app.use(express.json({ limit: '2mb' }))
  app.get('/api/health', async (_request, response) => {
    await pool.query('SELECT 1')
    response.json({ status: 'ok' })
  })
  app.use('/api', async (request, response, next) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) return response.status(401).json({ error: 'Sign in to use this workspace.' })
    const origin = request.get('origin')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin && !trustedOrigins.includes(origin)) {
      return response.status(403).json({ error: 'This origin cannot change the workspace.' })
    }
    response.locals.userId = session.user.id
    response.set('Cache-Control', 'no-store')
    next()
  })

  app.get('/api/workspace', async (_request, response) => {
    response.json(await readWorkspace(pool, response.locals.userId))
  })

  app.put('/api/workspace', async (request, response) => {
    const { workspace, revision } = workspaceWriteSchema.parse(request.body)
    response.json(await replaceWorkspace(pool, response.locals.userId, workspace, revision))
  })

  app.get('/api/projects', async (_request, response) => {
    const { workspace, revision } = await readWorkspace(pool, response.locals.userId)
    response.json({ projects: workspace.projects, revision })
  })

  app.get('/api/projects/:id', async (request, response) => {
    const id = projectIdSchema.parse(request.params.id)
    const { workspace, revision } = await readWorkspace(pool, response.locals.userId)
    const project = workspace.projects.find((item) => item.id === id)
    if (!project) throw new HttpError(404, 'Project not found.')
    response.json({ project, revision })
  })

  app.post('/api/projects', async (request, response) => {
    const project = projectSchema.parse(request.body)
    const result = await changeProjects(pool, response.locals.userId, (workspace) => {
      if (workspace.projects.some((item) => item.id === project.id)) throw new HttpError(409, 'This project identifier already exists.')
      workspace.projects.push(project)
    })
    response.status(201).json({ project: result.workspace.projects.find((item) => item.id === project.id), revision: result.revision })
  })

  app.patch('/api/projects/:id', async (request, response) => {
    const id = projectIdSchema.parse(request.params.id)
    const patch = projectPatchSchema.parse(request.body)
    const result = await changeProjects(pool, response.locals.userId, (workspace) => {
      const index = workspace.projects.findIndex((item) => item.id === id)
      if (index < 0) throw new HttpError(404, 'Project not found.')
      workspace.projects[index] = { ...workspace.projects[index], ...patch }
    })
    response.json({ project: result.workspace.projects.find((item) => item.id === id), revision: result.revision })
  })

  app.delete('/api/projects/:id', async (request, response) => {
    const id = projectIdSchema.parse(request.params.id)
    const result = await changeProjects(pool, response.locals.userId, (workspace) => {
      if (!workspace.projects.some((item) => item.id === id)) throw new HttpError(404, 'Project not found.')
      workspace.projects = workspace.projects.filter((item) => item.id !== id)
      workspace.tasks = workspace.tasks.filter((item) => item.projectId !== id)
      workspace.reviews = workspace.reviews.filter((item) => item.projectId !== id)
    })
    response.json(result)
  })

  app.use('/api', (_request, response) => response.status(404).json({ error: 'Endpoint not found.' }))
  const staticDir = resolve(options.staticDir ?? '../dist')
  if (statSync(staticDir, { throwIfNoEntry: false })?.isDirectory()) {
    app.get('/', (_request, response) => response.redirect('/fieldwork/'))
    app.use('/fieldwork', express.static(staticDir))
  }
  const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof ZodError) return response.status(400).json({ error: 'Invalid workspace data.', issues: error.issues })
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message })
    if (error?.type === 'entity.parse.failed') return response.status(400).json({ error: 'Invalid JSON.' })
    if (error?.type === 'entity.too.large') return response.status(413).json({ error: 'Workspace is too large.' })
    console.error('Fieldwork request failed:', error)
    return response.status(500).json({ error: 'The workspace could not be saved or loaded. Try again.' })
  }
  app.use(handleError)
  return { app, auth }
}
