import {
  progressExportSchema,
  userProgressSchema,
  type ProgressExport,
  type UserPreferences,
  type UserProgress,
} from '../../../domain/model'
import type { BrowserStorage, StorageChange } from '../browserStorage'
import { hashString, parseJsonWithSchema, stableJson } from '../json'
import { storageKeys } from '../keys'
import type {
  BackupRepository,
  ImportCommitResult,
  ImportPreview,
  ProgressRepository,
} from './types'

function createExportPayload(
  progress: UserProgress,
  settings: UserPreferences,
  exportedAt: string,
): ProgressExport {
  const content = stableJson({ progress, settings, exportedAt })
  return {
    schemaVersion: 1,
    contentVersion: progress.contentVersion,
    exportedAt,
    checksum: hashString(content),
    progress,
    settings,
  }
}

function verifyChecksum(payload: ProgressExport): boolean {
  const content = stableJson({
    progress: payload.progress,
    settings: payload.settings,
    exportedAt: payload.exportedAt,
  })
  return payload.checksum === hashString(content)
}

export function createProgressRepository(
  storage: BrowserStorage,
  backups: BackupRepository,
): ProgressRepository {
  function load(): UserProgress | null {
    const raw = storage.getRaw(storageKeys.progress)
    if (raw === null) {
      return null
    }

    const result = parseJsonWithSchema(raw, userProgressSchema)
    if (result.ok) {
      return result.value
    }

    backups.createBackup('corrupted progress', raw)
    storage.removeRaw(storageKeys.progress)
    return null
  }

  function previewImport(rawJson: string): ImportPreview {
    const result = parseJsonWithSchema(rawJson, progressExportSchema)
    if (!result.ok) {
      return {
        valid: false,
        summary: 'Файл не прошел Zod-валидацию импорта.',
        issues: [result.reason],
      }
    }

    const checksumValid = verifyChecksum(result.value)
    return {
      valid: checksumValid,
      schemaVersion: result.value.schemaVersion,
      contentVersion: result.value.contentVersion,
      exportedAt: result.value.exportedAt,
      checksumValid,
      summary: checksumValid
        ? 'Файл подходит для импорта прогресса.'
        : 'Файл прочитан, но checksum не совпадает.',
      issues: checksumValid ? [] : ['checksum mismatch'],
    }
  }

  return {
    load,
    save(progress) {
      storage.setRaw(storageKeys.progress, stableJson(progress))
    },
    clear() {
      storage.removeRaw(storageKeys.progress)
    },
    repair() {
      return load() === null
    },
    exportProgress(progress, settings, exportedAt) {
      return stableJson(createExportPayload(progress, settings, exportedAt))
    },
    previewImport,
    importProgress(rawJson, confirmOverwrite, currentSnapshot): ImportCommitResult {
      const preview = previewImport(rawJson)
      if (!preview.valid || !confirmOverwrite) {
        return {
          ok: false,
          preview,
        }
      }

      const parsed = parseJsonWithSchema(rawJson, progressExportSchema)
      if (!parsed.ok || !verifyChecksum(parsed.value)) {
        return {
          ok: false,
          preview: {
            valid: false,
            summary: 'Файл не прошел повторную проверку перед импортом.',
            issues: [parsed.ok ? 'checksum mismatch' : parsed.reason],
          },
        }
      }

      const backupKey = backups.createBackup('before progress import', currentSnapshot)
      storage.setRaw(storageKeys.progress, stableJson(parsed.value.progress))
      storage.setRaw(storageKeys.settings, stableJson(parsed.value.settings))

      return {
        ok: true,
        progress: parsed.value.progress,
        settings: parsed.value.settings,
        backupKey,
      }
    },
    subscribe(listener: (change: StorageChange) => void) {
      return storage.subscribe((change) => {
        if (change.key === storageKeys.progress) {
          listener(change)
        }
      })
    },
  }
}
