import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultUserPreferences, createEmptyUserProgress } from '../../domain/model/defaults'
import { progressExportSchema } from '../../domain/model'
import {
  createBackupRepository,
  createMemoryBrowserStorage,
  createPiniaPersistedStorage,
  createProgressRepository,
  createSettingsRepository,
  hashString,
  stableJson,
  storageKeys,
} from './index'
import { createMigrationEnvelope, migrateUserPreferences, migrateUserProgress } from './migrations'

const now = '2026-07-19T00:00:00.000Z'
const contentVersion = '2026.07.foundation'

afterEach(() => {
  vi.useRealTimers()
})

describe('storage services', () => {
  it('serializes JSON deterministically for checksums', () => {
    const first = stableJson({ beta: 2, alpha: { zeta: true, gamma: false } })
    const second = stableJson({ alpha: { gamma: false, zeta: true }, beta: 2 })

    expect(first).toBe(second)
    expect(hashString(first)).toBe(hashString(second))
  })

  it('migrates legacy settings and progress into versioned schemas', () => {
    const settings = migrateUserPreferences({ theme: 'dark' }, now)
    const progress = migrateUserProgress({ activeLessonId: 'lesson.legacy' }, now, contentVersion)
    const envelope = createMigrationEnvelope([...settings.records, ...progress.records])

    expect(settings.value.theme).toBe('dark')
    expect(settings.records).toHaveLength(1)
    expect(progress.value.lessonProgress['lesson.legacy']?.mastery).toBe(0)
    expect(progress.value.contentVersion).toBe(contentVersion)
    expect(envelope.records).toHaveLength(2)
  })

  it('recovers from corrupted stored JSON by backing it up and clearing the active key', () => {
    const storage = createMemoryBrowserStorage({
      [storageKeys.progress]: '{broken-json',
      [storageKeys.settings]: stableJson({ schemaVersion: 1, theme: 'invalid' }),
    })
    const backups = createBackupRepository(storage)
    const progressRepository = createProgressRepository(storage, backups)
    const settingsRepository = createSettingsRepository(storage, backups)

    expect(progressRepository.load()).toBeNull()
    expect(settingsRepository.load()).toBeNull()
    expect(storage.getRaw(storageKeys.progress)).toBeNull()
    expect(storage.getRaw(storageKeys.settings)).toBeNull()
    expect(backups.list().map((backup) => backup.reason)).toEqual(
      expect.arrayContaining(['corrupted progress', 'corrupted settings']),
    )
  })

  it('exports, previews and imports progress with confirmation and backup', () => {
    const storage = createMemoryBrowserStorage()
    const backups = createBackupRepository(storage)
    const repository = createProgressRepository(storage, backups)
    const progress = createEmptyUserProgress(now, contentVersion)
    const settings = createDefaultUserPreferences()
    const exported = repository.exportProgress(progress, settings, now)
    const payload = progressExportSchema.parse(JSON.parse(exported))

    expect(repository.previewImport(exported)).toMatchObject({
      valid: true,
      contentVersion,
      checksumValid: true,
    })
    expect(repository.importProgress(exported, false, 'current').ok).toBe(false)

    const result = repository.importProgress(exported, true, 'current')

    expect(result.ok).toBe(true)
    expect(payload.progress.userId).toBe('local')
    expect(storage.getRaw(storageKeys.progress)).not.toBeNull()
    expect(storage.getRaw(storageKeys.settings)).not.toBeNull()
    expect(backups.latest()?.payload).toBe('current')
  })

  it('rejects tampered imports when checksum no longer matches', () => {
    const storage = createMemoryBrowserStorage()
    const backups = createBackupRepository(storage)
    const repository = createProgressRepository(storage, backups)
    const exported = repository.exportProgress(
      createEmptyUserProgress(now, contentVersion),
      createDefaultUserPreferences(),
      now,
    )
    const payload = progressExportSchema.parse(JSON.parse(exported))
    const tampered = stableJson({
      ...payload,
      progress: {
        ...payload.progress,
        contentVersion: 'tampered',
      },
    })

    expect(repository.previewImport(tampered)).toMatchObject({
      valid: false,
      checksumValid: false,
    })
  })

  it('debounces Pinia persisted writes and backs up corrupted Pinia state', () => {
    vi.useFakeTimers()
    const storage = createMemoryBrowserStorage({
      'corrupt-key': 'not-json',
    })
    const backups = createBackupRepository(storage)
    const piniaStorage = createPiniaPersistedStorage(storage, backups, 50)

    expect(piniaStorage.getItem('corrupt-key')).toBeNull()
    expect(backups.latest()?.reason).toBe('corrupted pinia state corrupt-key')

    piniaStorage.setItem('state-key', '{"count":1}')
    piniaStorage.setItem('state-key', '{"count":2}')
    expect(storage.getRaw('state-key')).toBeNull()

    vi.advanceTimersByTime(49)
    expect(storage.getRaw('state-key')).toBeNull()

    vi.advanceTimersByTime(1)
    expect(storage.getRaw('state-key')).toBe('{"count":2}')
  })

  it('syncs repository changes through storage subscriptions', () => {
    const storage = createMemoryBrowserStorage()
    const backups = createBackupRepository(storage)
    const repository = createProgressRepository(storage, backups)
    const changes: string[] = []
    const stop = repository.subscribe((change) => {
      changes.push(change.key)
    })

    storage.emitExternalChange(
      storageKeys.progress,
      stableJson(createEmptyUserProgress(now, contentVersion)),
    )
    stop()
    storage.emitExternalChange(storageKeys.progress, null)

    expect(changes).toEqual([storageKeys.progress])
  })
})
