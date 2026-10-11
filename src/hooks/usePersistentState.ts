import { useEffect, useState } from 'react'

/** useState that remembers a number between visits. Storage failures are ignored. */
export function usePersistentState(key: string, fallback: number) {
  const [value, setValue] = useState(() => {
    try {
      const n = Number(localStorage.getItem(key))
      return localStorage.getItem(key) !== null && Number.isFinite(n) ? n : fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, String(value))
    } catch {
      // private mode / blocked storage
    }
  }, [key, value])
  return [value, setValue] as const
}
