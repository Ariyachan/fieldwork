import type { ReactNode } from 'react'
import { ArrowUpRight, Check, Plus } from 'lucide-react'
import { Avatar, Empty, Stage } from './components'
import { dateLabel, progress, type Task, type Workspace } from './data'
import Plan from './Plan'

export default function StudioDesk({
  workspace,
  onReview,
  onCreate,
  onAddTask,
  renderTask,
}: {
  workspace: Workspace
  onReview: (id: string) => void
  onCreate: () => void
  onAddTask: () => void
  renderTask: (task: Task, showProject: boolean) => ReactNode
}) {
  const active = workspace.projects.filter(
    (project) => project.stage !== 'Completed',
  )
  const open = workspace.tasks.filter((task) => task.status !== 'Done')
  const pending = workspace.reviews.filter(
    (review) => review.status === 'In review',
  )
  const drawing = pending[0] || workspace.reviews[0]
  const project = workspace.projects.find(
    (project) => project.id === drawing?.projectId,
  )
  const next = [...open].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4)
  return (
    <div className="studio-desk">
      <div className="page-heading desk-heading">
        <div>
          <span className="eyebrow">ATELIER / PROJECTS & PRACTICE</span>
          <h1>Studio desk</h1>
          <p>The drawings, decisions and next steps in one place.</p>
        </div>
        <button className="button primary" onClick={onCreate}>
          <Plus size={16} />
          New project
        </button>
      </div>
      <div className="desk-status" aria-label="Workspace summary">
        <a href="#/projects">
          <strong>{String(active.length).padStart(2, '0')}</strong>
          <span>active projects</span>
          <ArrowUpRight size={14} />
        </a>
        <a href="#/reviews">
          <strong>{String(pending.length).padStart(2, '0')}</strong>
          <span>drawing sets in review</span>
          <ArrowUpRight size={14} />
        </a>
        <a href="#/tasks">
          <strong>{String(open.length).padStart(2, '0')}</strong>
          <span>open tasks</span>
          <ArrowUpRight size={14} />
        </a>
      </div>
      <section className="desk-workbench" aria-label="Drawings and decisions">
        {drawing && project && (
          <div className="desk-drawing">
            <div className="desk-section-title">
              <h2>On the desk</h2>
              <span className="eyebrow">LATEST DRAWING SET</span>
            </div>
            <button
              className="drawing-sheet"
              onClick={() => onReview(drawing.id)}
              aria-label={`Review ${drawing.name}`}
            >
              <div className="sheet-heading">
                <span>
                  {project.code} / {project.name}
                </span>
                <Stage stage={drawing.status} />
              </div>
              <div className="sheet-plan">
                <Plan variant={project.id} />
                {drawing.notes
                  .filter((note) => !note.resolved)
                  .map((note) => (
                    <span
                      className="sheet-pin"
                      style={{ left: `${note.x}%`, top: `${note.y}%` }}
                      key={note.id}
                    >
                      {drawing.notes.indexOf(note) + 1}
                    </span>
                  ))}
              </div>
              <div className="sheet-titleblock">
                <div>
                  <span className="eyebrow">{drawing.version}</span>
                  <h3>{drawing.name}</h3>
                </div>
                <span className="sheet-action">
                  Open review <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          </div>
        )}
        <aside className="decision-queue">
          <div className="desk-section-title">
            <h2>Needs a decision</h2>
            <span>{pending.length}</span>
          </div>
          {pending.length ? (
            pending.map((review, index) => (
              <button
                className="decision-item"
                key={review.id}
                onClick={() => onReview(review.id)}
              >
                <span className="decision-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <span className="eyebrow">
                    {
                      workspace.projects.find((p) => p.id === review.projectId)
                        ?.name
                    }
                  </span>
                  <h3>{review.name}</h3>
                  <span className="decision-meta">
                    {review.version.split(' / ')[0]}
                    <i />
                    {review.notes.some((note) => !note.resolved)
                      ? `${review.notes.filter((note) => !note.resolved).length} open comments`
                      : 'Ready to approve'}
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </button>
            ))
          ) : (
            <div className="decisions-clear">
              <Check size={18} />
              <p>
                All drawing sets approved.
                <small>The studio can move forward.</small>
              </p>
            </div>
          )}
          <a className="queue-all" href="#/reviews">
            View all drawing sets <ArrowUpRight size={15} />
          </a>
          <div className="desk-next-deadline">
            <span className="eyebrow">NEXT PROJECT MILESTONE</span>
            {[...active]
              .sort((a, b) => a.due.localeCompare(b.due))
              .slice(0, 1)
              .map((p) => (
                <a href={`#/projects/${p.id}`} key={p.id}>
                  <strong>{dateLabel(p.due)}</strong>
                  <span>
                    {p.name}
                    <small>{p.stage}</small>
                  </span>
                  <ArrowUpRight size={17} />
                </a>
              ))}
          </div>
        </aside>
      </section>
      <div className="desk-bottom">
        <section className="desk-tasks">
          <div className="desk-section-title">
            <h2>Next in the studio</h2>
            <a href="#/tasks">
              Task board <ArrowUpRight size={14} />
            </a>
          </div>
          {next.length ? (
            next.map((task) => renderTask(task, true))
          ) : (
            <Empty
              title="The task list is clear"
              text="Add the next step from the task board."
            />
          )}
          <button className="add-task-inline" onClick={onAddTask}>
            <Plus size={15} />
            Add a task
          </button>
        </section>
        <section className="desk-projects">
          <div className="desk-section-title">
            <h2>Active projects</h2>
            <a href="#/projects">
              All projects <ArrowUpRight size={14} />
            </a>
          </div>
          {active.map((p) => (
            <a
              className="desk-project-row"
              href={`#/projects/${p.id}`}
              key={p.id}
            >
              <span className="project-code-inline">{p.code}</span>
              <div>
                <h3>{p.name}</h3>
                <span>{p.stage}</span>
                <div className="progress-track">
                  <span style={{ width: `${progress(workspace, p.id)}%` }} />
                </div>
              </div>
              <Avatar code={p.members[0]} small />
              <ArrowUpRight size={15} />
            </a>
          ))}
        </section>
      </div>
    </div>
  )
}
