import {
  createBackupRepository,
  createProgressRepository,
  createSettingsRepository,
  type BackupRepository,
  type ProgressRepository,
  type SettingsRepository,
} from './repositories'
import {
  createLocalBrowserStorage,
  createMemoryBrowserStorage,
  type BrowserStorage,
} from './browserStorage'
import { createPiniaPersistedStorage, type PiniaStorageLike } from './piniaStorage'

export type StorageRuntime = {
  storage: BrowserStorage
  backups: BackupRepository
  progressRepository: ProgressRepository
  settingsRepository: SettingsRepository
  piniaStorage: PiniaStorageLike
}

let runtime: StorageRuntime | null = null

export function createStorageRuntime(storage: BrowserStorage, debounceMs = 150): StorageRuntime {
  const backups = createBackupRepository(storage)
  return {
    storage,
    backups,
    progressRepository: createProgressRepository(storage, backups),
    settingsRepository: createSettingsRepository(storage, backups),
    piniaStorage: createPiniaPersistedStorage(storage, backups, debounceMs),
  }
}

export function getStorageRuntime(): StorageRuntime {
  if (runtime) {
    return runtime
  }

  const storage =
    typeof window === 'undefined' ? createMemoryBrowserStorage() : createLocalBrowserStorage()
  runtime = createStorageRuntime(storage)
  return runtime
}

export const runtimePiniaStorage: PiniaStorageLike = {
  getItem(key) {
    return getStorageRuntime().piniaStorage.getItem(key)
  },
  setItem(key, value) {
    getStorageRuntime().piniaStorage.setItem(key, value)
  },
  removeItem(key) {
    getStorageRuntime().piniaStorage.removeItem(key)
  },
}

export function configureStorageRuntime(nextRuntime: StorageRuntime): void {
  runtime = nextRuntime
}

export function resetStorageRuntime(): void {
  runtime = null
}
