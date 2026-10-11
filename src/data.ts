export type TaskStatus = 'To do' | 'In progress' | 'Done'
export type Task = {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  assignee: string
  due: string
  priority: 'Normal' | 'High'
}
export type Project = {
  id: string
  code: string
  name: string
  client: string
  kind: string
  location: string
  stage: string
  color: string
  image: string
  due: string
  description: string
  members: string[]
}
export type Review = {
  id: string
  projectId: string
  name: string
  version: string
  status: 'In review' | 'Approved'
  notes: {
    id: string
    text: string
    resolved: boolean
    x: number
    y: number
    author?: string
  }[]
}
export type Workspace = {
  projects: Project[]
  tasks: Task[]
  reviews: Review[]
}

export const members: Record<string, { name: string; color: string }> = {
  AM: { name: 'Alex Morgan', color: '#e6d6c7' },
  JL: { name: 'Jamie Lee', color: '#d1dcd4' },
  SC: { name: 'Sam Chen', color: '#ded6e8' },
  RP: { name: 'Riley Park', color: '#dddcc8' },
}
export const seed: Workspace = {
  projects: [
    {
      id: 'courtyard',
      code: 'FW—024',
      name: 'The Courtyard House',
      client: 'Harper & Co.',
      kind: 'Residential',
      location: 'Copenhagen, DK',
      stage: 'Design development',
      color: '#a7b4a2',
      image: 'courtyard.jpg',
      due: '2026-10-16',
      description:
        'A quiet family home organized around a central garden. The current phase brings the interior material palette and ground-floor layout together for client review.',
      members: ['AM', 'JL', 'SC'],
    },
    {
      id: 'form',
      code: 'FW—023',
      name: 'Form & Matter',
      client: 'Form & Matter',
      kind: 'Retail',
      location: 'London, UK',
      stage: 'Concept design',
      color: '#c8af9a',
      image: 'form.jpg',
      due: '2026-10-20',
      description:
        'A gallery and retail space for independent objects. A flexible display system, warm materials and a generous street-facing threshold define the concept.',
      members: ['JL', 'RP'],
    },
    {
      id: 'north',
      code: 'FW—022',
      name: 'North Block',
      client: 'North Collective',
      kind: 'Workplace',
      location: 'Stockholm, SE',
      stage: 'Documentation',
      color: '#abbac3',
      image: '',
      due: '2026-10-23',
      description:
        'A compact shared workspace with a central meeting pavilion. Documentation focuses on the joinery package, lighting coordination and acoustic partitions.',
      members: ['AM', 'SC'],
    },
    {
      id: 'archive',
      code: 'FW—021',
      name: 'Archive No. 8',
      client: 'Archive Studio',
      kind: 'Cultural',
      location: 'Amsterdam, NL',
      stage: 'Completed',
      color: '#cabba9',
      image: '',
      due: '2026-09-28',
      description:
        'An archive reading room with a modular shelving system. Final drawings and the approved material schedule are collected here for handover.',
      members: ['SC', 'RP'],
    },
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'courtyard',
      title: 'Prepare ground-floor plan for review',
      status: 'In progress',
      assignee: 'AM',
      due: '2026-10-12',
      priority: 'High',
    },
    {
      id: 't2',
      projectId: 'courtyard',
      title: 'Confirm limestone sample with client',
      status: 'To do',
      assignee: 'JL',
      due: '2026-10-13',
      priority: 'Normal',
    },
    {
      id: 't3',
      projectId: 'courtyard',
      title: 'Revise courtyard glazing detail',
      status: 'To do',
      assignee: 'SC',
      due: '2026-10-16',
      priority: 'High',
    },
    {
      id: 't4',
      projectId: 'courtyard',
      title: 'Issue updated interior elevations',
      status: 'Done',
      assignee: 'AM',
      due: '2026-10-09',
      priority: 'Normal',
    },
    {
      id: 't5',
      projectId: 'form',
      title: 'Develop display plinth options',
      status: 'In progress',
      assignee: 'JL',
      due: '2026-10-14',
      priority: 'Normal',
    },
    {
      id: 't6',
      projectId: 'form',
      title: 'Review entry sequence',
      status: 'To do',
      assignee: 'RP',
      due: '2026-10-15',
      priority: 'Normal',
    },
    {
      id: 't7',
      projectId: 'form',
      title: 'Collect site measurements',
      status: 'Done',
      assignee: 'RP',
      due: '2026-10-08',
      priority: 'Normal',
    },
    {
      id: 't8',
      projectId: 'north',
      title: 'Coordinate reflected ceiling plan',
      status: 'In progress',
      assignee: 'SC',
      due: '2026-10-14',
      priority: 'High',
    },
    {
      id: 't9',
      projectId: 'north',
      title: 'Finalize acoustic partition schedule',
      status: 'To do',
      assignee: 'AM',
      due: '2026-10-19',
      priority: 'Normal',
    },
    {
      id: 't10',
      projectId: 'north',
      title: 'Check meeting pavilion joinery',
      status: 'Done',
      assignee: 'SC',
      due: '2026-10-10',
      priority: 'Normal',
    },
    {
      id: 't11',
      projectId: 'archive',
      title: 'Issue final drawing set',
      status: 'Done',
      assignee: 'RP',
      due: '2026-09-28',
      priority: 'Normal',
    },
    {
      id: 't12',
      projectId: 'archive',
      title: 'Complete client handover',
      status: 'Done',
      assignee: 'SC',
      due: '2026-09-28',
      priority: 'Normal',
    },
  ],
  reviews: [
    {
      id: 'r1',
      projectId: 'courtyard',
      name: 'Ground floor — general arrangement',
      version: 'A—101 / Rev. 03',
      status: 'In review',
      notes: [
        {
          id: 'n1',
          text: 'Could we widen the opening to the courtyard? Keep the structural pier on the east side.',
          resolved: false,
          x: 49,
          y: 40,
        },
        {
          id: 'n2',
          text: 'Align the kitchen island with the glazing axis.',
          resolved: false,
          x: 73,
          y: 45,
        },
      ],
    },
    {
      id: 'r2',
      projectId: 'form',
      name: 'Gallery — display arrangement',
      version: 'A—201 / Rev. 01',
      status: 'In review',
      notes: [
        {
          id: 'n3',
          text: 'Allow a clear route through the central display area.',
          resolved: false,
          x: 51,
          y: 54,
        },
      ],
    },
    {
      id: 'r3',
      projectId: 'north',
      name: 'Workspace — furniture layout',
      version: 'A—102 / Rev. 02',
      status: 'Approved',
      notes: [],
    },
  ],
}
export function progress(workspace: Workspace, projectId: string) {
  const tasks = workspace.tasks.filter((task) => task.projectId === projectId)
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === 'Done').length / tasks.length) *
          100,
      )
    : 0
}
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) {
  return new Intl.DateTimeFormat('en-GB', options).format(
    new Date(`${date}T12:00:00`),
  )
}
export function findProjects(
  projects: Project[],
  query: string,
  filter = 'All',
) {
  return projects.filter(
    (project) =>
      `${project.name} ${project.client} ${project.code} ${project.location}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === 'All' ||
        (filter === 'Completed'
          ? project.stage === 'Completed'
          : project.stage !== 'Completed')),
  )
}
export function setTaskStatus(
  workspace: Workspace,
  id: string,
  status: TaskStatus,
): Workspace {
  return {
    ...workspace,
    tasks: workspace.tasks.map((task) =>
      task.id === id ? { ...task, status } : task,
    ),
  }
}
