import type { UserPreferences, UserProgress } from '../../../domain/model'
import type { StorageChange } from '../browserStorage'

export type ImportPreview = {
  valid: boolean
  schemaVersion?: number
  contentVersion?: string
  exportedAt?: string
  checksumValid?: boolean
  summary: string
  issues: readonly string[]
}

export type ImportCommitResult =
  | { ok: true; progress: UserProgress; settings: UserPreferences; backupKey: string }
  | { ok: false; preview: ImportPreview }

export type ProgressRepository = {
  load(): UserProgress | null
  save(progress: UserProgress): void
  clear(): void
  repair(): boolean
  exportProgress(progress: UserProgress, settings: UserPreferences, exportedAt: string): string
  previewImport(rawJson: string): ImportPreview
  importProgress(
    rawJson: string,
    confirmOverwrite: boolean,
    currentSnapshot: string,
  ): ImportCommitResult
  subscribe(listener: (change: StorageChange) => void): () => void
}

export type SettingsRepository = {
  load(): UserPreferences | null
  save(settings: UserPreferences): void
  clear(): void
  repair(): boolean
  subscribe(listener: (change: StorageChange) => void): () => void
}

export type BackupRecord = {
  key: string
  createdAt: string
  reason: string
  payload: string
}

export type BackupRepository = {
  createBackup(reason: string, payload: string, createdAt?: string): string
  latest(): BackupRecord | null
  list(): readonly BackupRecord[]
  clear(): void
}
