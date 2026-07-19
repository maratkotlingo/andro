export type StorageChange = {
  key: string
  oldValue: string | null
  newValue: string | null
}

export type BrowserStorage = {
  getRaw(key: string): string | null
  setRaw(key: string, value: string): void
  removeRaw(key: string): void
  keys(): readonly string[]
  subscribe(listener: (change: StorageChange) => void): () => void
}

export type MemoryBrowserStorage = BrowserStorage & {
  emitExternalChange(key: string, value: string | null): void
}

export function createLocalBrowserStorage(): BrowserStorage {
  return {
    getRaw(key) {
      return window.localStorage.getItem(key)
    },
    setRaw(key, value) {
      window.localStorage.setItem(key, value)
    },
    removeRaw(key) {
      window.localStorage.removeItem(key)
    },
    keys() {
      return Array.from({ length: window.localStorage.length }, (_, index) =>
        window.localStorage.key(index),
      ).filter((key): key is string => key !== null)
    },
    subscribe(listener) {
      const handler = (event: StorageEvent): void => {
        if (event.key) {
          listener({
            key: event.key,
            oldValue: event.oldValue,
            newValue: event.newValue,
          })
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}

export function createMemoryBrowserStorage(
  initial: Record<string, string> = {},
): MemoryBrowserStorage {
  const values = new Map(Object.entries(initial))
  const listeners = new Set<(change: StorageChange) => void>()

  function emit(change: StorageChange): void {
    for (const listener of listeners) {
      listener(change)
    }
  }

  return {
    getRaw(key) {
      return values.get(key) ?? null
    },
    setRaw(key, value) {
      values.set(key, value)
    },
    removeRaw(key) {
      values.delete(key)
    },
    keys() {
      return Array.from(values.keys())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emitExternalChange(key, value) {
      const oldValue = values.get(key) ?? null
      if (value === null) {
        values.delete(key)
      } else {
        values.set(key, value)
      }
      emit({ key, oldValue, newValue: value })
    },
  }
}
