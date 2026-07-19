import type { BrowserStorage } from './browserStorage'
import type { BackupRepository } from './repositories/types'

export type PiniaStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createPiniaPersistedStorage(
  storage: BrowserStorage,
  backups: BackupRepository,
  debounceMs = 150,
): PiniaStorageLike {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function schedule(key: string, value: string): void {
    const existing = timers.get(key)
    if (existing) {
      clearTimeout(existing)
    }

    timers.set(
      key,
      setTimeout(() => {
        storage.setRaw(key, value)
        timers.delete(key)
      }, debounceMs),
    )
  }

  return {
    getItem(key) {
      const raw = storage.getRaw(key)
      if (raw === null) {
        return null
      }

      try {
        JSON.parse(raw)
        return raw
      } catch {
        backups.createBackup(`corrupted pinia state ${key}`, raw)
        storage.removeRaw(key)
        return null
      }
    },
    setItem(key, value) {
      if (debounceMs <= 0) {
        storage.setRaw(key, value)
        return
      }

      schedule(key, value)
    },
    removeItem(key) {
      const existing = timers.get(key)
      if (existing) {
        clearTimeout(existing)
        timers.delete(key)
      }
      storage.removeRaw(key)
    },
  }
}
