import { userPreferencesSchema, type UserPreferences } from '../../../domain/model'
import type { BrowserStorage, StorageChange } from '../browserStorage'
import { parseJsonWithSchema, stableJson } from '../json'
import { storageKeys } from '../keys'
import type { BackupRepository, SettingsRepository } from './types'

export function createSettingsRepository(
  storage: BrowserStorage,
  backups: BackupRepository,
): SettingsRepository {
  function load(): UserPreferences | null {
    const raw = storage.getRaw(storageKeys.settings)
    if (raw === null) {
      return null
    }

    const result = parseJsonWithSchema(raw, userPreferencesSchema)
    if (result.ok) {
      return result.value
    }

    backups.createBackup('corrupted settings', raw)
    storage.removeRaw(storageKeys.settings)
    return null
  }

  return {
    load,
    save(settings) {
      storage.setRaw(storageKeys.settings, stableJson(settings))
    },
    clear() {
      storage.removeRaw(storageKeys.settings)
    },
    repair() {
      return load() === null
    },
    subscribe(listener: (change: StorageChange) => void) {
      return storage.subscribe((change) => {
        if (change.key === storageKeys.settings) {
          listener(change)
        }
      })
    },
  }
}
