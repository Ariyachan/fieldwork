import { z } from 'zod'

const id = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/)
const text = (max: number) => z.string().trim().min(1).max(max)
const date = z.iso.date()
const member = z.enum(['AM', 'JL', 'SC', 'RP'])

export const projectSchema = z.strictObject({
  id,
  code: text(40),
  name: text(200),
  client: text(200),
  kind: text(100),
  location: text(200),
  stage: text(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  image: z.string().max(200).regex(/^(?:[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)|)$/),
  due: date,
  description: z.string().max(5000),
  members: z.array(member).max(4).refine((items) => new Set(items).size === items.length, 'Duplicate members'),
})

const taskSchema = z.strictObject({
  id,
  projectId: id,
  title: text(300),
  status: z.enum(['To do', 'In progress', 'Done']),
  assignee: member,
  due: date,
  priority: z.enum(['Normal', 'High']),
})

const noteSchema = z.strictObject({
  id,
  text: text(3000),
  resolved: z.boolean(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  author: member.optional(),
})

const reviewSchema = z.strictObject({
  id,
  projectId: id,
  name: text(300),
  version: text(100),
  status: z.enum(['In review', 'Approved']),
  notes: z.array(noteSchema).max(200),
}).refine((review) => review.status !== 'Approved' || review.notes.every((note) => note.resolved), {
  path: ['status'],
  message: 'Resolve all comments before approving a review',
})

export const workspaceSchema = z.strictObject({
  projects: z.array(projectSchema).max(200),
  tasks: z.array(taskSchema).max(2000),
  reviews: z.array(reviewSchema).max(500),
}).superRefine((workspace, context) => {
  const seen = new Set<string>()
  const register = (value: string, path: (string | number)[]) => {
    if (seen.has(value)) context.addIssue({ code: 'custom', path, message: 'Duplicate identifier' })
    seen.add(value)
  }
  workspace.projects.forEach((project, index) => register(project.id, ['projects', index, 'id']))
  const projects = new Set(workspace.projects.map((project) => project.id))
  workspace.tasks.forEach((task, index) => {
    register(task.id, ['tasks', index, 'id'])
    if (!projects.has(task.projectId)) context.addIssue({ code: 'custom', path: ['tasks', index, 'projectId'], message: 'Unknown project' })
  })
  workspace.reviews.forEach((review, index) => {
    register(review.id, ['reviews', index, 'id'])
    if (!projects.has(review.projectId)) context.addIssue({ code: 'custom', path: ['reviews', index, 'projectId'], message: 'Unknown project' })
    review.notes.forEach((note, noteIndex) => register(note.id, ['reviews', index, 'notes', noteIndex, 'id']))
  })
})

export const workspaceWriteSchema = z.strictObject({
  workspace: workspaceSchema,
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
})

export const projectPatchSchema = projectSchema.omit({ id: true }).partial().refine((value) => Object.keys(value).length > 0, 'Supply at least one project field')
export const projectIdSchema = id
export type Workspace = z.infer<typeof workspaceSchema>
export type Project = z.infer<typeof projectSchema>
