import { useCallback, useEffect, useState, type SetStateAction } from 'react'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Storage disabled (private mode) or a hand-edited, unparsable value.
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage disabled: keep working in memory.
  }
}

/**
 * useState that is persisted to localStorage under `key` and kept in sync
 * across browser tabs. `null`/`undefined` removes the key instead of storing
 * the string "null". The setter has a stable identity, like useState's.
 *
 * `key` is expected to be constant for the lifetime of the component.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  const setAndPersist = useCallback(
    (action: SetStateAction<T>) => {
      setValue((prev) => {
        const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action
        write(key, next)
        return next
      })
    },
    [key],
  )

  // The `storage` event only fires in *other* tabs, so this never echoes our own writes.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || event.key !== key) return
      setValue(event.newValue === null ? initialValue : read(key, initialValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // initialValue is deliberately excluded: callers pass literals that change identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setAndPersist] as const
}
