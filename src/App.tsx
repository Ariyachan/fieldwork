import { useEffect, useState, type FormEvent } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Menu from '@radix-ui/react-dropdown-menu'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  CircleCheck,
  Clock3,
  Ellipsis,
  Folder,
  Grid2X2,
  LayoutDashboard,
  List,
  ListTodo,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react'
import {
  dateLabel,
  findProjects,
  members,
  progress,
  seed,
  setTaskStatus,
  type Project,
  type Review,
  type Task,
  type TaskStatus,
} from './data'
import { useWorkspace } from './useWorkspace'
import {
  Avatar,
  Empty,
  Modal,
  ProjectCard,
  ProjectVisual,
  Stage,
} from './components'
import Plan from './Plan'
import DrawingReview from './DrawingReview'
import Schedule from './Schedule'
import StudioDesk from './StudioDesk'
import './App.css'
import './Refinement.css'

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'tasks', label: 'Task board', icon: ListTodo },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
]
export default function App() {
  const { workspace, update, storageError } = useWorkspace()
  const [route, setRoute] = useState(location.hash.slice(2) || 'overview')
  const [modal, setModal] = useState<
    'search' | 'project' | 'task' | 'settings' | null
  >(null)
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All')
  const [listView, setListView] = useState(false),
    [taskProject, setTaskProject] = useState('All')
  const [reviewId, setReviewId] = useState<string | null>(null),
    [toast, setToast] = useState('')
  const [resetRequested, setResetRequested] = useState(false)
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'
  const [todayLabel] = useState(() =>
    new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )
  const currentProject = workspace.projects.find(
    (project) => route === `projects/${project.id}`,
  )
  const activeSection = currentProject ? 'projects' : route
  const review = workspace.reviews.find((item) => item.id === reviewId)
  const pendingReviews = workspace.reviews.filter(
    (item) => item.status === 'In review',
  )
  const visibleProjects = findProjects(workspace.projects, query, filter)
  const projectTasks = currentProject
    ? workspace.tasks.filter((task) => task.projectId === currentProject.id)
    : []
  const projectDrawing = workspace.reviews.find(
    (item) => item.projectId === currentProject?.id,
  )
  const displayedTasks = workspace.tasks.filter(
    (task) => taskProject === 'All' || task.projectId === taskProject,
  )
  useEffect(() => {
    const handler = () => {
      setRoute(location.hash.slice(2) || 'overview')
      setQuery('')
      setReviewId(null)
      setModal(null)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setModal('search')
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    document.title = `${currentProject?.name || sections.find((section) => section.id === route)?.label || 'Workspace'} · FIELDWORK`
  }, [route, currentProject])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3200)
      return () => clearTimeout(timer)
    }
  }, [toast])
  function navigate(path: string) {
    location.hash = `/${path}`
    setModal(null)
  }
  function statusChange(task: Task, status: TaskStatus) {
    update((current) => setTaskStatus(current, task.id, status))
    setToast(`${status === 'Done' ? 'Completed' : 'Updated'}: ${task.title}`)
  }
  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name')).trim(),
      client = String(fields.get('client')).trim()
    if (!name || !client) return
    const id = crypto.randomUUID()
    const project: Project = {
      id,
      name,
      client,
      code: `FW—${String(workspace.projects.length + 21).padStart(3, '0')}`,
      kind: String(fields.get('kind')),
      due: String(fields.get('due')),
      stage: 'Concept design',
      location: 'Location to be confirmed',
      color: '#b4c1ac',
      image: '',
      description:
        'A new project, ready for its first brief. Add tasks and bring the team into the next phase.',
      members: ['AM'],
    }
    update((current) => ({
      ...current,
      projects: [...current.projects, project],
    }))
    navigate(`projects/${id}`)
    setToast('Project created')
  }
  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget),
      title = String(fields.get('title')).trim()
    if (!title) return
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      projectId: String(fields.get('project')),
      due: String(fields.get('due')),
      assignee: String(fields.get('assignee')),
      priority: String(fields.get('priority')) as Task['priority'],
      status: 'To do',
    }
    update((current) => ({ ...current, tasks: [...current.tasks, task] }))
    setModal(null)
    setToast('Task added')
  }
  function exportTasks() {
    const rows = [
      ['Project', 'Task', 'Status', 'Assignee', 'Due', 'Priority'],
      ...displayedTasks.map((task) => [
        workspace.projects.find((project) => project.id === task.projectId)
          ?.name || '',
        task.title,
        task.status,
        members[task.assignee].name,
        task.due,
        task.priority,
      ]),
    ]
    const content = rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
      )
      .join('\r\n')
    const url = URL.createObjectURL(
        new Blob([content], { type: 'text/csv;charset=utf-8' }),
      ),
      anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'fieldwork-tasks.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('Task list exported')
  }
  function taskRow(task: Task, showProject = false) {
    return (
      <div className="task-row" key={task.id}>
        <button
          className={`task-check ${task.status === 'Done' ? 'checked' : ''}`}
          aria-label={`${task.status === 'Done' ? 'Reopen' : 'Complete'} ${task.title}`}
          onClick={() =>
            statusChange(task, task.status === 'Done' ? 'To do' : 'Done')
          }
        >
          {task.status === 'Done' && <Check size={13} />}
        </button>
        <div className="task-label">
          <span className={task.status === 'Done' ? 'crossed' : ''}>
            {task.title}
          </span>
          {showProject && (
            <small>
              {
                workspace.projects.find(
                  (project) => project.id === task.projectId,
                )?.name
              }
            </small>
          )}
        </div>
        {task.priority === 'High' && (
          <span className="priority-mark" title="High priority">
            ↑
          </span>
        )}
        <span className="task-date">{dateLabel(task.due)}</span>
        <Avatar code={task.assignee} small />
      </div>
    )
  }
  function projectCard(project: Project) {
    return (
      <ProjectCard
        key={project.id}
        project={project}
        percent={progress(workspace, project.id)}
        list={listView}
      />
    )
  }
  function reviewCard(item: Review) {
    const project = workspace.projects.find(
      (project) => project.id === item.projectId,
    )!
    return (
      <button
        className="review-card"
        key={item.id}
        onClick={() => setReviewId(item.id)}
      >
        <div className="review-preview">
          <Plan variant={project.id} />
          <span className="drawing-number">{item.version.split(' / ')[0]}</span>
        </div>
        <div className="review-card-content">
          <div className="review-card-top">
            <span className="eyebrow">{project.name}</span>
            <Stage stage={item.status} />
          </div>
          <h3>{item.name}</h3>
          <div className="review-card-footer">
            <span>{item.version}</span>
            <span>
              <MessageSquare size={13} />
              {item.notes.filter((note) => !note.resolved).length} open
            </span>
          </div>
        </div>
      </button>
    )
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#/overview" className="wordmark" aria-label="FIELDWORK home">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          FIELDWORK
        </a>
        <button
          className="workspace-select"
          aria-label="Studio settings"
          onClick={() => setModal('settings')}
        >
          <span className="workspace-symbol">a.</span>
          <span>
            Atelier Studio<small>Studio workspace</small>
          </span>
          <Settings2 size={15} />
        </button>
        <button
          className="sidebar-search"
          onClick={() => {
            setModal('search')
            setQuery('')
          }}
        >
          <Search size={16} />
          <span>Search anything</span>
          <kbd>{shortcut}</kbd>
        </button>
        <span className="nav-label">WORKSPACE</span>
        <nav className="main-nav">
          {sections.map(({ id, label, icon: Icon }) => (
            <a
              href={`#/${id}`}
              className={activeSection === id ? 'active' : ''}
              key={id}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {id === 'reviews' && pendingReviews.length > 0 && (
                <span className="nav-count">{pendingReviews.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="sidebar-subtitle">
            <span>YOUR PROJECTS</span>
            <button
              aria-label="Create project"
              className="tiny-button"
              onClick={() => setModal('project')}
            >
              <Plus size={15} />
            </button>
          </div>
          {workspace.projects
            .filter((project) => project.stage !== 'Completed')
            .slice(0, 4)
            .map((project) => (
              <a href={`#/projects/${project.id}`} key={project.id}>
                <span
                  className="project-dot"
                  style={{ background: project.color }}
                />
                <span>{project.name}</span>
              </a>
            ))}
        </div>
        <div className="sidebar-bottom">
          <div className="studio-note">
            <span className="studio-note-label">THE STUDIO TEAM</span>
            <div className="studio-team-avatars">
              {Object.keys(members).map((code) => (
                <Avatar code={code} key={code} small />
              ))}
            </div>
            <p className="studio-team-caption">
              {Object.keys(members).length} studio members
            </p>
          </div>
          <button
            className="profile-button"
            onClick={() => setModal('settings')}
          >
            <Avatar code="AM" />
            <span>
              Alex Morgan<small>Studio principal</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="desktop-only">Workspace</span>
            <ChevronRight className="desktop-only" size={13} />
            <span>
              {currentProject
                ? 'Projects'
                : sections.find((section) => section.id === route)?.label ||
                  'Overview'}
            </span>
            {currentProject && (
              <>
                <ChevronRight size={13} />
                <strong>{currentProject.name}</strong>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">{todayLabel}</span>
            <button
              className="icon-button mobile-search"
              aria-label="Search workspace"
              onClick={() => {
                setModal('search')
                setQuery('')
              }}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="View pending reviews"
              onClick={() => navigate('reviews')}
            >
              <Bell size={18} />
              {pendingReviews.length > 0 && <i />}
            </button>
            <Avatar code="AM" small />
          </div>
        </header>
        <main id="main-content">
          {storageError && (
            <div className="storage-warning" role="alert">
              Your browser could not save these changes. Keep this tab open to
              retain them.
            </div>
          )}
          {route === 'overview' && (
            <StudioDesk
              workspace={workspace}
              onReview={setReviewId}
              onCreate={() => setModal('project')}
              onAddTask={() => setModal('task')}
              renderTask={taskRow}
            />
          )}
          {route === 'projects' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE STUDIO / PORTFOLIO</span>
                  <h1>Projects</h1>
                  <p>From first sketch to final handover.</p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setModal('project')}
                >
                  <Plus size={16} />
                  New project
                </button>
              </div>
              <div className="filter-toolbar">
                <div
                  className="filter-tabs"
                  role="group"
                  aria-label="Project status"
                >
                  {['All', 'Active', 'Completed'].map((item) => (
                    <button
                      className={filter === item ? 'selected' : ''}
                      aria-pressed={filter === item}
                      onClick={() => setFilter(item)}
                      key={item}
                    >
                      {item}
                      <span>
                        {item === 'All'
                          ? workspace.projects.length
                          : workspace.projects.filter((project) =>
                              item === 'Completed'
                                ? project.stage === 'Completed'
                                : project.stage !== 'Completed',
                            ).length}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="filter-right">
                  <label className="search-field">
                    <Search size={15} />
                    <input
                      aria-label="Search projects"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search projects"
                    />
                  </label>
                  <div className="view-switch">
                    <button
                      className={!listView ? 'selected' : ''}
                      aria-label="Grid view"
                      aria-pressed={!listView}
                      onClick={() => setListView(false)}
                    >
                      <Grid2X2 size={16} />
                    </button>
                    <button
                      className={listView ? 'selected' : ''}
                      aria-label="List view"
                      aria-pressed={listView}
                      onClick={() => setListView(true)}
                    >
                      <List size={17} />
                    </button>
                  </div>
                </div>
              </div>
              {visibleProjects.length ? (
                <div
                  className={`projects-grid all-projects ${listView ? 'projects-list' : ''}`}
                >
                  {visibleProjects.map(projectCard)}
                  {!query && filter !== 'Completed' && (
                    <button
                      className="new-project-card"
                      onClick={() => setModal('project')}
                    >
                      <span>
                        <Plus size={23} />
                      </span>
                      <strong>A new beginning</strong>
                      <small>Create a project</small>
                    </button>
                  )}
                </div>
              ) : (
                <Empty
                  title="No projects found"
                  text="Try a different name, client or location."
                  action={
                    <button
                      className="button secondary"
                      onClick={() => {
                        setQuery('')
                        setFilter('All')
                      }}
                    >
                      Clear filters
                    </button>
                  }
                />
              )}
            </>
          )}
          {currentProject && (
            <>
              <a href="#/projects" className="back-link">
                <ArrowLeft size={14} />
                All projects
              </a>
              <div className="page-heading project-page-heading">
                <div>
                  <span className="eyebrow">
                    {currentProject.code} / {currentProject.kind}
                  </span>
                  <h1>{currentProject.name}</h1>
                  <p>
                    {currentProject.client} <span className="inline-divider" />{' '}
                    {currentProject.location}
                  </p>
                </div>
                <div className="detail-heading-actions">
                  <div className="avatar-stack">
                    {currentProject.members.map((code) => (
                      <Avatar code={code} key={code} />
                    ))}
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setModal('task')}
                  >
                    <Plus size={16} />
                    Add task
                  </button>
                </div>
              </div>
              <Tabs.Root
                defaultValue="overview"
                className="project-tabs"
                key={currentProject.id}
              >
                <div className="project-status-bar">
                  <Stage stage={currentProject.stage} />
                  <span>Milestone {dateLabel(currentProject.due)}</span>
                </div>
                <Tabs.List aria-label="Project views">
                  <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                  <Tabs.Trigger value="tasks">
                    Tasks <span>{projectTasks.length}</span>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="files">
                    Drawings{' '}
                    <span>
                      {
                        workspace.reviews.filter(
                          (item) => item.projectId === currentProject.id,
                        ).length
                      }
                    </span>
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="overview">
                  <div className="detail-hero">
                    {projectDrawing ? (
                      <button
                        className="project-drawing-sheet"
                        onClick={() => setReviewId(projectDrawing.id)}
                        aria-label={`Review ${projectDrawing.name}`}
                      >
                        <div className="sheet-heading">
                          <span>{projectDrawing.version}</span>
                          <Stage stage={projectDrawing.status} />
                        </div>
                        <Plan variant={currentProject.id} />
                        <div className="sheet-titleblock">
                          <div>
                            <span className="eyebrow">CURRENT DRAWING</span>
                            <h3>{projectDrawing.name}</h3>
                          </div>
                          <ArrowUpRight size={19} />
                        </div>
                      </button>
                    ) : (
                      <div className="detail-photo">
                        <ProjectVisual project={currentProject} />
                        <span>Concept study / {currentProject.kind}</span>
                      </div>
                    )}
                    <div className="detail-brief">
                      <span className="eyebrow">PROJECT BRIEF</span>
                      <h2>
                        {currentProject.stage === 'Completed'
                          ? 'Ready for handover.'
                          : currentProject.stage === 'Concept design'
                            ? 'Defining the direction.'
                            : currentProject.stage === 'Documentation'
                              ? 'Coordinating the details.'
                              : 'Developing the design.'}
                      </h2>
                      <p>{currentProject.description}</p>
                      <dl>
                        <div>
                          <dt>Current phase</dt>
                          <dd>
                            <Stage stage={currentProject.stage} />
                          </dd>
                        </div>
                        <div>
                          <dt>Next milestone</dt>
                          <dd>{dateLabel(currentProject.due)}</dd>
                        </div>
                        <div>
                          <dt>Task completion</dt>
                          <dd>{progress(workspace, currentProject.id)}%</dd>
                        </div>
                      </dl>
                      <div className="progress-track">
                        <span
                          style={{
                            width: `${progress(workspace, currentProject.id)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overview-lower">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Project tasks</h2>
                        <span className="muted-small">
                          {
                            projectTasks.filter(
                              (task) => task.status === 'Done',
                            ).length
                          }
                          /{projectTasks.length} complete
                        </span>
                      </div>
                      {projectTasks.length ? (
                        projectTasks.map((task) => taskRow(task))
                      ) : (
                        <Empty
                          title="Your first task"
                          text="Break the project into clear next steps."
                        />
                      )}
                      <button
                        className="add-task-inline"
                        onClick={() => setModal('task')}
                      >
                        <Plus size={15} />
                        Add a task
                      </button>
                    </section>
                    <section className="milestone-panel">
                      <span className="eyebrow">THE ROAD AHEAD</span>
                      <h2>Project phases</h2>
                      {[
                        'Concept design',
                        'Design development',
                        'Documentation',
                        'Completed',
                      ].map((phase, index) => {
                        const currentIndex = [
                          'Concept design',
                          'Design development',
                          'Documentation',
                          'Completed',
                        ].indexOf(currentProject.stage)
                        return (
                          <div
                            className={`milestone ${index < currentIndex ? 'finished' : ''} ${index === currentIndex ? 'current' : ''}`}
                            key={phase}
                          >
                            <span>
                              {index < currentIndex ? (
                                <Check size={13} />
                              ) : (
                                String(index + 1).padStart(2, '0')
                              )}
                            </span>
                            <div>
                              <strong>{phase}</strong>
                              <small>
                                {index === currentIndex
                                  ? 'Current phase'
                                  : index < currentIndex
                                    ? 'Completed'
                                    : 'Upcoming'}
                              </small>
                            </div>
                          </div>
                        )
                      })}
                    </section>
                  </div>
                </Tabs.Content>
                <Tabs.Content value="tasks">
                  <section className="panel wide-panel">
                    <div className="panel-heading">
                      <h2>All project tasks</h2>
                      <button
                        className="text-link"
                        onClick={() => setModal('task')}
                      >
                        <Plus size={15} />
                        Add task
                      </button>
                    </div>
                    {projectTasks.length ? (
                      projectTasks.map((task) => taskRow(task))
                    ) : (
                      <Empty
                        title="No tasks yet"
                        text="Add the first step for this project."
                      />
                    )}
                  </section>
                </Tabs.Content>
                <Tabs.Content value="files">
                  <div className="reviews-grid">
                    {workspace.reviews
                      .filter((item) => item.projectId === currentProject.id)
                      .map(reviewCard)}
                  </div>
                  {!workspace.reviews.some(
                    (item) => item.projectId === currentProject.id,
                  ) && (
                    <Empty
                      title="No drawing sets yet"
                      text="This project is at the brief stage. Explore drawing review in the included projects."
                    />
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </>
          )}
          {route === 'tasks' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE WORK / ONE STEP AT A TIME</span>
                  <h1>Task board</h1>
                  <p>Keep the next move clear.</p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setModal('task')}
                >
                  <Plus size={16} />
                  New task
                </button>
              </div>
              <div className="filter-toolbar">
                <label className="project-select">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="Filter tasks by project"
                    value={taskProject}
                    onChange={(event) => setTaskProject(event.target.value)}
                  >
                    <option value="All">All projects</option>
                    {workspace.projects.map((project) => (
                      <option value={project.id} key={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button secondary" onClick={exportTasks}>
                  <ArrowDownToLine size={15} />
                  Export tasks
                </button>
              </div>
              <div className="kanban">
                {(['To do', 'In progress', 'Done'] as TaskStatus[]).map(
                  (status) => (
                    <section className="kanban-column" key={status}>
                      <div className="kanban-heading">
                        <h2>
                          {status === 'Done' ? (
                            <CircleCheck size={16} />
                          ) : status === 'In progress' ? (
                            <Clock3 size={16} />
                          ) : (
                            <Circle size={16} />
                          )}{' '}
                          {status}
                          <span>
                            {
                              displayedTasks.filter(
                                (task) => task.status === status,
                              ).length
                            }
                          </span>
                        </h2>
                      </div>
                      {displayedTasks
                        .filter((task) => task.status === status)
                        .map((task) => {
                          const project = workspace.projects.find(
                            (item) => item.id === task.projectId,
                          )!
                          return (
                            <article className="kanban-card" key={task.id}>
                              <div className="kanban-card-top">
                                <span
                                  className="task-project-chip"
                                  style={{ borderLeftColor: project.color }}
                                >
                                  {project.name}
                                </span>
                                <Menu.Root>
                                  <Menu.Trigger
                                    className="tiny-button"
                                    aria-label={`Change status of ${task.title}`}
                                  >
                                    <Ellipsis size={17} />
                                  </Menu.Trigger>
                                  <Menu.Portal>
                                    <Menu.Content
                                      className="dropdown-menu"
                                      sideOffset={5}
                                    >
                                      <Menu.Label>Move task to</Menu.Label>
                                      {(
                                        [
                                          'To do',
                                          'In progress',
                                          'Done',
                                        ] as TaskStatus[]
                                      ).map((next) => (
                                        <Menu.Item
                                          key={next}
                                          onSelect={() =>
                                            statusChange(task, next)
                                          }
                                        >
                                          {next}
                                          {next === status && (
                                            <Check size={14} />
                                          )}
                                        </Menu.Item>
                                      ))}
                                    </Menu.Content>
                                  </Menu.Portal>
                                </Menu.Root>
                              </div>
                              <h3>{task.title}</h3>
                              <div className="kanban-card-footer">
                                <span>
                                  <CalendarDays size={13} />
                                  {dateLabel(task.due)}
                                </span>
                                {task.priority === 'High' && (
                                  <span className="high-priority">↑ High</span>
                                )}
                                <Avatar code={task.assignee} small />
                              </div>
                            </article>
                          )
                        })}
                      {!displayedTasks.some(
                        (task) => task.status === status,
                      ) && (
                        <div className="column-empty">Nothing here yet.</div>
                      )}
                    </section>
                  ),
                )}
              </div>
            </>
          )}
          {route === 'reviews' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE DETAILS / BETTER TOGETHER</span>
                  <h1>Drawing reviews</h1>
                  <p>Bring every conversation back to the drawing.</p>
                </div>
                <span className="review-summary">
                  <span />
                  {pendingReviews.length} awaiting review
                </span>
              </div>
              <div className="reviews-grid">
                {workspace.reviews.map(reviewCard)}
              </div>
              <div className="review-instruction">
                <MessageSquare size={17} />
                <p>
                  Open a drawing to leave a pinned comment, resolve feedback or
                  approve the set.
                </p>
              </div>
            </>
          )}
          {route === 'schedule' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE TIMELINE / LOOKING AHEAD</span>
                  <h1>Studio schedule</h1>
                  <p>Make space for what matters next.</p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setModal('task')}
                >
                  <Plus size={16} />
                  New task
                </button>
              </div>
              <Schedule
                workspace={workspace}
                onTask={(projectId) => {
                  setTaskProject(projectId)
                  navigate('tasks')
                }}
              />
            </>
          )}
          {!currentProject &&
            !sections.some((section) => section.id === route) && (
              <Empty
                title="This page isn't here"
                text="Return to your workspace to find a project."
                action={
                  <a className="button primary" href="#/overview">
                    Go to overview
                  </a>
                }
              />
            )}
          <footer className="workspace-footer">
            <span>
              FIELDWORK <span className="footer-separator">/</span> Studio
              workspace
            </span>
            <a
              href={`${import.meta.env.BASE_URL}case-study.html`}
              target="_blank"
              rel="noreferrer"
            >
              Project case study
              <ArrowUpRight size={12} />
            </a>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile workspace navigation">
        {sections.map(({ id, label, icon: Icon }) => (
          <a
            href={`#/${id}`}
            className={activeSection === id ? 'active' : ''}
            key={id}
          >
            <Icon size={20} strokeWidth={1.7} />
            <span>{id === 'tasks' ? 'Tasks' : label}</span>
          </a>
        ))}
      </nav>
      <Modal
        open={modal === 'search'}
        onClose={() => setModal(null)}
        title="Find your next step"
        description="Search projects, clients and tasks."
        className="search-modal"
      >
        <label className="command-input">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search workspace"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A project, a client, a task…"
          />
        </label>
        <div className="search-results">
          <span className="eyebrow">PROJECTS</span>
          {findProjects(workspace.projects, query).map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`projects/${project.id}`)}
            >
              <span
                className="project-dot"
                style={{ background: project.color }}
              />
              <span>
                {project.name}
                <small>{project.client}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
          <span className="eyebrow">TASKS</span>
          {workspace.tasks
            .filter((task) =>
              task.title.toLowerCase().includes(query.toLowerCase()),
            )
            .slice(0, 5)
            .map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setTaskProject(task.projectId)
                  navigate('tasks')
                }}
              >
                <ListTodo size={17} />
                <span>
                  {task.title}
                  <small>{task.status}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          {!findProjects(workspace.projects, query).length &&
            !workspace.tasks.some((task) =>
              task.title.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="search-empty">No matches. Try another word.</p>}
        </div>
      </Modal>
      <Modal
        open={modal === 'project'}
        onClose={() => setModal(null)}
        title="A new project"
        description="Start with the essentials. The details can follow."
      >
        <form className="project-form" onSubmit={createProject}>
          <label>
            Project name
            <input
              name="name"
              required
              maxLength={80}
              placeholder="e.g. The Garden Studio"
              autoFocus
            />
          </label>
          <label>
            Client
            <input
              name="client"
              required
              maxLength={80}
              placeholder="Client or organization"
            />
          </label>
          <div className="form-grid">
            <label>
              Project type
              <select name="kind">
                <option>Residential</option>
                <option>Retail</option>
                <option>Workplace</option>
                <option>Cultural</option>
              </select>
            </label>
            <label>
              Next milestone
              <input
                type="date"
                name="due"
                required
                defaultValue="2026-10-30"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => setModal(null)}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              Create project
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={modal === 'task'}
        onClose={() => setModal(null)}
        title="One clear next step"
        description="Give the task a home, an owner and a date."
      >
        <form className="project-form" onSubmit={createTask}>
          <label>
            Task name
            <input
              name="title"
              required
              maxLength={140}
              placeholder="What needs to happen?"
              autoFocus
            />
          </label>
          <label>
            Project
            <select
              name="project"
              defaultValue={
                currentProject?.id ||
                (taskProject !== 'All'
                  ? taskProject
                  : workspace.projects[0]?.id)
              }
            >
              {workspace.projects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Assigned to
              <select name="assignee">
                {Object.entries(members).map(([code, member]) => (
                  <option key={code} value={code}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                name="due"
                type="date"
                required
                defaultValue="2026-10-16"
              />
            </label>
          </div>
          <label>
            Priority
            <select name="priority">
              <option>Normal</option>
              <option>High</option>
            </select>
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setModal(null)}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              Add task
              <Plus size={15} />
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={modal === 'settings'}
        onClose={() => setModal(null)}
        title="Atelier Studio"
        description="Your working space, ready to explore."
      >
        <div className="settings-content">
          <div className="settings-profile">
            <Avatar code="AM" />
            <div>
              <strong>Alex Morgan</strong>
              <span>Studio principal</span>
            </div>
          </div>
          <p>
            Projects, tasks and drawing feedback are saved in this browser.
            Start fresh whenever you need a clean workspace.
          </p>
          {resetRequested ? (
            <div className="reset-confirmation">
              <p>
                Your added projects, tasks and comments will be removed from
                this browser.
              </p>
              <div>
                <button
                  className="button secondary"
                  onClick={() => setResetRequested(false)}
                >
                  Keep workspace
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    update(() => structuredClone(seed))
                    setResetRequested(false)
                    navigate('overview')
                    setToast('Workspace reset')
                  }}
                >
                  Reset and start over
                </button>
              </div>
            </div>
          ) : (
            <button
              className="button secondary"
              onClick={() => setResetRequested(true)}
            >
              Reset workspace
            </button>
          )}
          <a
            className="text-link"
            href={`${import.meta.env.BASE_URL}case-study.html`}
            target="_blank"
            rel="noreferrer"
          >
            Explore the project case study
            <ArrowUpRight size={14} />
          </a>
        </div>
      </Modal>
      {review && (
        <DrawingReview
          review={review}
          project={workspace.projects.find(
            (project) => project.id === review.projectId,
          )!}
          update={update}
          onClose={() => setReviewId(null)}
          notify={setToast}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}
