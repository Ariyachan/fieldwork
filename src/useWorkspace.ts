import { useCallback, useEffect, useRef, useState } from 'react'
import { seed, type Workspace } from './data'
import { ApiError, apiEnabled, apiRequest } from './api'

const storageKey = 'fieldwork.workspace.v1'
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    try {
      const saved = !apiEnabled && localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : structuredClone(seed)
    } catch {
      return structuredClone(seed)
    }
  })
  const [storageError, setStorageError] = useState(false)
  const [ready, setReady] = useState(!apiEnabled)
  const [loadError, setLoadError] = useState('')
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>(
    'saved',
  )
  const [saveMessage, setSaveMessage] = useState('')
  const [conflict, setConflict] = useState(false)
  const current = useRef(workspace)
  const revision = useRef(0)
  const queue = useRef(Promise.resolve())
  const failed = useRef(false)
  const generation = useRef(0)

  const loadFromServer = useCallback(async (signal?: AbortSignal) => {
    const requestGeneration = ++generation.current
    try {
      const result = await apiRequest<{
        workspace: Workspace
        revision: number
      }>('/workspace', { signal })
      if (signal?.aborted || requestGeneration !== generation.current) return
      current.current = result.workspace
      revision.current = result.revision
      failed.current = false
      setWorkspace(result.workspace)
      setSaveState('saved')
      setSaveMessage('')
      setConflict(false)
      setReady(true)
    } catch (reason) {
      if (signal?.aborted || requestGeneration !== generation.current) return
      setLoadError(
        reason instanceof ApiError && reason.status === 401
          ? 'Your session has expired. Sign in again to open your workspace.'
          : 'Your workspace couldn’t be loaded. Check your connection and try again.',
      )
    }
  }, [])

  function reload() {
    setLoadError('')
    setReady(false)
    return loadFromServer()
  }

  useEffect(() => {
    const controller = new AbortController()
    // State changes occur after the remote request, not synchronously inside this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    if (apiEnabled) void loadFromServer(controller.signal)
    return () => {
      controller.abort()
      // A signed-out account must never flush queued writes with a later user's cookie.
      generation.current += 1
    }
  }, [loadFromServer])

  function save(next: Workspace) {
    setSaveState('saving')
    const saveGeneration = generation.current
    queue.current = queue.current.then(async () => {
      if (failed.current || saveGeneration !== generation.current) return
      try {
        const result = await apiRequest<{
          workspace: Workspace
          revision: number
        }>('/workspace', {
          method: 'PUT',
          body: JSON.stringify({ workspace: next, revision: revision.current }),
        })
        if (saveGeneration !== generation.current) return
        revision.current = result.revision
        if (current.current === next) setSaveState('saved')
      } catch (reason) {
        if (saveGeneration !== generation.current) return
        failed.current = true
        setSaveState('error')
        const isConflict = reason instanceof ApiError && reason.status === 409
        setConflict(isConflict)
        setSaveMessage(
          isConflict
            ? 'This workspace changed in another window. Your local edits haven’t been saved. Reload the saved version before continuing.'
            : 'Your latest edits haven’t been saved. They’re still visible in this window; check your connection and try again.',
        )
      }
    })
  }

  function retrySave() {
    if (conflict) return
    failed.current = false
    setSaveMessage('')
    save(current.current)
  }

  function update(transform: (current: Workspace) => Workspace) {
    const next = transform(current.current)
    current.current = next
    setWorkspace(next)
    if (apiEnabled) {
      if (!failed.current) save(next)
    } else {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
        setStorageError(false)
      } catch {
        setStorageError(true)
      }
    }
  }
  return {
    workspace,
    update,
    storageError,
    ready,
    loadError,
    saveState,
    saveMessage,
    conflict,
    reload,
    retrySave,
  }
}
