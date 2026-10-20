import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import Schedule from '../src/Schedule'
import { findProjects, progress, seed, setTaskStatus } from '../src/data'

describe('workspace operations', () => {
  it('keeps the phone agenda scoped to the selected month', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Schedule workspace={structuredClone(seed)} onTask={() => {}} />,
    )
    const agenda = container.querySelector('.mobile-agenda') as HTMLElement
    expect(
      within(agenda).getByRole('button', { name: /Prepare ground-floor plan/ }),
    ).toBeInTheDocument()
    expect(
      within(agenda).getByRole('link', { name: /The Courtyard House/ }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(within(agenda).queryByRole('button')).not.toBeInTheDocument()
    expect(
      within(agenda).getByText(/No deadlines this month/),
    ).toBeInTheDocument()
  })
  it('keeps project progress scoped to its tasks and reversible', () => {
    const original = structuredClone(seed)
    const next = setTaskStatus(original, 't1', 'Done')
    expect(progress(original, 'courtyard')).toBe(25)
    expect(progress(next, 'courtyard')).toBe(50)
    expect(progress(next, 'north')).toBe(33)
    expect(progress(setTaskStatus(next, 't1', 'To do'), 'courtyard')).toBe(25)
  })
  it('combines search and project status without losing case-insensitive matching', () => {
    expect(
      findProjects(seed.projects, 'LONDON', 'Active').map((p) => p.id),
    ).toEqual(['form'])
    expect(findProjects(seed.projects, 'Archive', 'Active')).toEqual([])
    expect(
      findProjects(seed.projects, '', 'Completed').map((p) => p.id),
    ).toEqual(['archive'])
  })
  it('creates a project, lands on its detail page and restores it after remount', async () => {
    const user = userEvent.setup(),
      mounted = render(<App />)
    await user.click(
      screen.getByRole('button', { name: 'New project', exact: true }),
    )
    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Project name'),
      'Garden Studio',
    )
    await user.type(
      within(dialog).getByLabelText('Client'),
      'Garden Collective',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Create project' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Garden Studio' }),
    ).toBeInTheDocument()
    mounted.unmount()
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Garden Studio' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Garden Collective/)).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!).projects.at(
        -1,
      ).client,
    ).toBe('Garden Collective')
  })
  it('completes and reopens a task with persistent state', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      screen.getByRole('button', {
        name: 'Complete Prepare ground-floor plan for review',
      }),
    )
    const stored = JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!)
    expect(stored.tasks.find((t: { id: string }) => t.id === 't1').status).toBe(
      'Done',
    )
    await user.click(
      screen.getByRole('link', { name: 'The Courtyard House', exact: true }),
    )
    await user.click(
      await screen.findByRole('button', {
        name: 'Reopen Prepare ground-floor plan for review',
      }),
    )
    expect(
      JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!).tasks.find(
        (t: { id: string }) => t.id === 't1',
      ).status,
    ).toBe('To do')
  })
  it('requires resolved feedback for approval and reopens review with new feedback', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      screen.getByRole('button', {
        name: 'Review Ground floor — general arrangement',
      }),
    )
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: 'Approve drawing' }),
    ).toBeDisabled()
    for (const button of within(dialog).getAllByRole('button', {
      name: 'Resolve comment',
    }))
      await user.click(button)
    await user.click(
      within(dialog).getByRole('button', { name: 'Approve drawing' }),
    )
    expect(
      within(dialog).getByRole('button', { name: 'Approved' }),
    ).toBeDisabled()
    await user.type(
      within(dialog).getByLabelText(/Leave a comment/),
      'Please confirm the door clearance.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Add comment' }),
    )
    expect(
      within(dialog).getByRole('button', { name: 'Approve drawing' }),
    ).toBeDisabled()
    expect(
      JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!).reviews.find(
        (r: { id: string }) => r.id === 'r1',
      ).status,
    ).toBe('In review')
  })
  it('positions feedback with the keyboard and preserves the author and pin', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      screen.getByRole('button', {
        name: 'Review Ground floor — general arrangement',
      }),
    )
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }))
    expect(within(dialog).getByText('150%')).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Fit drawing' }),
    )
    expect(within(dialog).getByText('100%')).toBeInTheDocument()
    within(dialog)
      .getByRole('region', { name: /Drawing canvas/ })
      .focus()
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}')
    const input = within(dialog).getByLabelText(/Leave a comment/)
    expect(input).toHaveFocus()
    await user.type(input, 'Check the door swing at this opening.')
    await user.click(
      within(dialog).getByRole('button', { name: 'Add comment' }),
    )
    const stored = JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!)
    expect(
      stored.reviews
        .find((review: { id: string }) => review.id === 'r1')
        .notes.at(-1),
    ).toMatchObject({
      x: 55,
      y: 55,
      author: 'AM',
      resolved: false,
      text: 'Check the door swing at this opening.',
    })
  })
  it('adds a task to the selected project with its assignee and due date', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add a task' }))
    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Task name'),
      'Coordinate window schedule',
    )
    await user.selectOptions(within(dialog).getByLabelText('Project'), 'north')
    await user.selectOptions(within(dialog).getByLabelText('Assigned to'), 'SC')
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'High')
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2026-11-02' } })
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }))
    const stored = JSON.parse(localStorage.getItem('fieldwork.workspace.v1')!)
    expect(stored.tasks.at(-1)).toMatchObject({
      title: 'Coordinate window schedule',
      projectId: 'north',
      assignee: 'SC',
      priority: 'High',
      status: 'To do',
      due: '2026-11-02',
    })
  })
})
