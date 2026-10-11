import { useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { dateLabel, type Workspace } from './data'

export default function Schedule({
  workspace,
  onTask,
}: {
  workspace: Workspace
  onTask: (projectId: string) => void
}) {
  const [month, setMonth] = useState(9),
    [year, setYear] = useState(2026)
  function move(offset: number) {
    const next = new Date(year, month + offset, 1)
    setMonth(next.getMonth())
    setYear(next.getFullYear())
  }
  return (
    <div className="schedule-layout">
      <section className="calendar-panel">
        <div className="calendar-header">
          <h2>
            {new Intl.DateTimeFormat('en-GB', {
              month: 'long',
              year: 'numeric',
            }).format(new Date(year, month, 1))}
          </h2>
          <div>
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => move(1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <span className="calendar-weekday" key={day}>
              {day}
            </span>
          ))}
          {Array.from(
            { length: (new Date(year, month, 1).getDay() + 6) % 7 },
            (_, index) => (
              <div className="calendar-day blank" key={`blank${index}`} />
            ),
          )}
          {Array.from(
            { length: new Date(year, month + 1, 0).getDate() },
            (_, index) => {
              const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
                tasks = workspace.tasks.filter(
                  (task) => task.due === date && task.status !== 'Done',
                ),
                projects = workspace.projects.filter(
                  (project) =>
                    project.due === date && project.stage !== 'Completed',
                )
              return (
                <div
                  className={`calendar-day ${date === '2026-10-11' ? 'today' : ''}`}
                  key={date}
                >
                  <span>{index + 1}</span>
                  {tasks.slice(0, 2).map((task) => (
                    <button
                      className="calendar-event"
                      key={task.id}
                      title={task.title}
                      onClick={() => onTask(task.projectId)}
                    >
                      <i
                        style={{
                          background: workspace.projects.find(
                            (project) => project.id === task.projectId,
                          )?.color,
                        }}
                      />
                      {task.title}
                    </button>
                  ))}
                  {projects.map((project) => (
                    <a
                      className="calendar-event milestone-event"
                      key={project.id}
                      href={`#/projects/${project.id}`}
                    >
                      {project.name} · Milestone
                    </a>
                  ))}
                  {tasks.length > 2 && <small>+{tasks.length - 2} more</small>}
                </div>
              )
            },
          )}
        </div>
      </section>
      <section className="upcoming-panel">
        <span className="eyebrow">NEXT MILESTONES</span>
        <h2>On the horizon</h2>
        {[...workspace.projects]
          .filter((project) => project.stage !== 'Completed')
          .sort((a, b) => a.due.localeCompare(b.due))
          .map((project) => (
            <a
              className="upcoming-event"
              key={project.id}
              href={`#/projects/${project.id}`}
            >
              <span className="event-date">
                <strong>{dateLabel(project.due, { day: 'numeric' })}</strong>
                <small>{dateLabel(project.due, { month: 'short' })}</small>
              </span>
              <span>
                <strong>{project.name}</strong>
                <small>{project.stage}</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          ))}
      </section>
    </div>
  )
}
