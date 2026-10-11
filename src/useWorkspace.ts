import { useState } from 'react'
import { seed, type Workspace } from './data'

const storageKey = 'fieldwork.workspace.v1'
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : structuredClone(seed)
    } catch {
      return structuredClone(seed)
    }
  })
  const [storageError, setStorageError] = useState(false)
  function update(transform: (current: Workspace) => Workspace) {
    setWorkspace((current) => {
      const next = transform(current)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
        setStorageError(false)
      } catch {
        setStorageError(true)
      }
      return next
    })
  }
  return { workspace, update, storageError }
}
