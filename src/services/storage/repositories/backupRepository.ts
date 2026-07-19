import type { BrowserStorage } from '../browserStorage'
import { storageKeys } from '../keys'
import type { BackupRecord, BackupRepository } from './types'

export function createBackupRepository(storage: BrowserStorage): BackupRepository {
  function list(): readonly BackupRecord[] {
    return storage
      .keys()
      .filter((key) => key.startsWith(storageKeys.backupPrefix))
      .map((key) => {
        const raw = storage.getRaw(key) ?? ''
        try {
          const parsed = JSON.parse(raw) as {
            createdAt?: unknown
            reason?: unknown
            payload?: unknown
          }
          return {
            key,
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
            reason: typeof parsed.reason === 'string' ? parsed.reason : 'unknown',
            payload: typeof parsed.payload === 'string' ? parsed.payload : raw,
          }
        } catch {
          return {
            key,
            createdAt: '',
            reason: 'unparseable backup',
            payload: raw,
          }
        }
      })
      .sort((left, right) => right.key.localeCompare(left.key))
  }

  return {
    createBackup(reason, payload, createdAt = new Date().toISOString()) {
      const baseKey = `${storageKeys.backupPrefix}${createdAt.replace(/[:.]/g, '-')}`
      let key = baseKey
      let suffix = 1
      while (storage.getRaw(key) !== null) {
        key = `${baseKey}-${suffix}`
        suffix += 1
      }
      storage.setRaw(
        key,
        JSON.stringify({
          createdAt,
          reason,
          payload,
        }),
      )
      return key
    },
    latest() {
      return list()[0] ?? null
    },
    list,
    clear() {
      for (const backup of list()) {
        storage.removeRaw(backup.key)
      }
    },
  }
}
