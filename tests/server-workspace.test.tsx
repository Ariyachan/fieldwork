import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { seed } from '../src/data'

const request = vi.hoisted(() => vi.fn())
vi.mock('../src/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api')>()),
  apiEnabled: true,
  apiRequest: request,
}))
import { useWorkspace } from '../src/useWorkspace'
import { ApiError } from '../src/api'

describe('server-backed workspace', () => {
  it('discards queued writes after the account workspace unmounts', async () => {
    let releaseFirst!: (value: unknown) => void
    request.mockReset()
    request.mockResolvedValueOnce({ workspace: structuredClone(seed), revision: 0 })
    request.mockImplementationOnce(() => new Promise((resolve) => { releaseFirst = resolve }))
    const { result, unmount } = renderHook(() => useWorkspace())
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => {
      result.current.update((w) => ({ ...w, tasks: w.tasks.slice(1) }))
      result.current.update((w) => ({ ...w, tasks: w.tasks.slice(1) }))
    })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    unmount()
    await act(async () => { releaseFirst({ revision: 1 }) })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('serializes quick edits using each successful revision, rather than losing one edit', async () => {
    let releaseFirst!: (value: unknown) => void
    request.mockReset()
    request.mockResolvedValueOnce({
      workspace: structuredClone(seed),
      revision: 4,
    })
    request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirst = resolve
        }),
    )
    request.mockResolvedValueOnce({ workspace: seed, revision: 6 })
    const { result } = renderHook(() => useWorkspace())
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => {
      result.current.update((w) => ({
        ...w,
        projects: w.projects.map((p) =>
          p.id === 'courtyard' ? { ...p, name: 'Courtyard revision' } : p,
        ),
      }))
      result.current.update((w) => ({
        ...w,
        projects: w.projects.map((p) =>
          p.id === 'north' ? { ...p, client: 'New client' } : p,
        ),
      }))
    })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    expect(JSON.parse(request.mock.calls[1][1].body).revision).toBe(4)
    await act(async () => {
      releaseFirst({ revision: 5 })
    })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(3))
    const saved = JSON.parse(request.mock.calls[2][1].body)
    expect(saved.revision).toBe(5)
    expect(
      saved.workspace.projects.find((p: { id: string }) => p.id === 'courtyard')
        .name,
    ).toBe('Courtyard revision')
    expect(
      saved.workspace.projects.find((p: { id: string }) => p.id === 'north')
        .client,
    ).toBe('New client')
    await waitFor(() => expect(result.current.saveState).toBe('saved'))
  })

  it('retains local edits on conflict and does not overwrite another window with a retry', async () => {
    request.mockReset()
    request.mockResolvedValueOnce({
      workspace: structuredClone(seed),
      revision: 0,
    })
    request.mockRejectedValueOnce(new ApiError('Conflict', 409))
    const { result } = renderHook(() => useWorkspace())
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() =>
      result.current.update((w) => ({
        ...w,
        projects: w.projects.map((p) => ({ ...p, name: 'Unsaved edit' })),
      })),
    )
    await waitFor(() => expect(result.current.conflict).toBe(true))
    expect(result.current.workspace.projects[0].name).toBe('Unsaved edit')
    expect(result.current.saveMessage).toMatch(/haven’t been saved/)
    act(() => result.current.retrySave())
    expect(request).toHaveBeenCalledTimes(2)
  })
})
