import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ExerciseAttempt, ReviewItem, UserPreferences, UserProgress } from '../domain/model'
import { createEmptyUserProgress } from '../domain/model/defaults'
import { currentContentVersion } from '../content/manifest'
import {
  getStorageRuntime,
  runtimePiniaStorage,
  stableJson,
  storageKeys,
  type ImportPreview,
} from '../services/storage'
import { migrateUserProgress } from '../services/storage/migrations'
import { useSettingsStore } from './settings'

function nowIso(): string {
  return new Date().toISOString()
}

function createInitialProgress(): UserProgress {
  return createEmptyUserProgress(nowIso(), currentContentVersion)
}

export const useProgressStore = defineStore(
  'progress',
  () => {
    const initial = createInitialProgress()
    const schemaVersion = ref(initial.schemaVersion)
    const contentVersion = ref(initial.contentVersion)
    const userId = ref(initial.userId)
    const lessonProgress = ref<UserProgress['lessonProgress']>(initial.lessonProgress)
    const skillProgress = ref<UserProgress['skillProgress']>(initial.skillProgress)
    const exerciseAttempts = ref<UserProgress['exerciseAttempts']>(initial.exerciseAttempts)
    const reviewQueue = ref<ReviewItem[]>(initial.reviewQueue)
    const lastImportPreview = ref<ImportPreview | null>(null)
    const lastBackupKey = ref<string | null>(null)
    let stopStorageSync: (() => void) | null = null

    const snapshot = computed<UserProgress>(() => ({
      schemaVersion: schemaVersion.value,
      contentVersion: contentVersion.value,
      userId: userId.value,
      lessonProgress: lessonProgress.value,
      skillProgress: skillProgress.value,
      exerciseAttempts: exerciseAttempts.value,
      reviewQueue: reviewQueue.value,
    }))

    const attemptCount = computed(() => Object.keys(exerciseAttempts.value).length)

    function applySnapshot(progress: UserProgress): void {
      schemaVersion.value = progress.schemaVersion
      contentVersion.value = progress.contentVersion
      userId.value = progress.userId
      lessonProgress.value = progress.lessonProgress
      skillProgress.value = progress.skillProgress
      exerciseAttempts.value = progress.exerciseAttempts
      reviewQueue.value = [...progress.reviewQueue]
    }

    function recordAttempt(attempt: ExerciseAttempt): void {
      exerciseAttempts.value = {
        ...exerciseAttempts.value,
        [attempt.id]: attempt,
      }

      const previous = lessonProgress.value[attempt.lessonId]
      lessonProgress.value = {
        ...lessonProgress.value,
        [attempt.lessonId]: {
          lessonId: attempt.lessonId,
          completedExerciseIds:
            attempt.result.status === 'correct'
              ? Array.from(new Set([...(previous?.completedExerciseIds ?? []), attempt.exerciseId]))
              : (previous?.completedExerciseIds ?? []),
          mastery:
            attempt.result.status === 'correct'
              ? Math.min((previous?.mastery ?? 0) + 0.1, 1)
              : (previous?.mastery ?? 0),
          updatedAt: attempt.answeredAt,
        },
      }
    }

    function exportProgress(settings?: UserPreferences): string {
      return getStorageRuntime().progressRepository.exportProgress(
        snapshot.value,
        settings ?? useSettingsStore().snapshot,
        nowIso(),
      )
    }

    function previewImport(rawJson: string): ImportPreview {
      const preview = getStorageRuntime().progressRepository.previewImport(rawJson)
      lastImportPreview.value = preview
      return preview
    }

    function importProgress(rawJson: string, confirmOverwrite: boolean): boolean {
      const settingsStore = useSettingsStore()
      const currentSnapshot = stableJson({
        progress: snapshot.value,
        settings: settingsStore.snapshot,
      })
      const result = getStorageRuntime().progressRepository.importProgress(
        rawJson,
        confirmOverwrite,
        currentSnapshot,
      )

      if (!result.ok) {
        lastImportPreview.value = result.preview
        return false
      }

      applySnapshot(result.progress)
      settingsStore.applySnapshot(result.settings)
      lastBackupKey.value = result.backupKey
      return true
    }

    function recoverFromStoredState(input: unknown): void {
      const migrated = migrateUserProgress(input, nowIso(), currentContentVersion)
      applySnapshot(migrated.value)
    }

    function clearPersonalAnswers(): void {
      exerciseAttempts.value = {}
    }

    function resetProgress(): void {
      applySnapshot(createInitialProgress())
      getStorageRuntime().progressRepository.clear()
    }

    function fullReset(): void {
      resetProgress()
      getStorageRuntime().backups.clear()
    }

    function startStorageSync(): void {
      if (stopStorageSync !== null) {
        return
      }

      stopStorageSync = getStorageRuntime().progressRepository.subscribe((change) => {
        if (!change.newValue) {
          applySnapshot(createInitialProgress())
          return
        }

        try {
          recoverFromStoredState(JSON.parse(change.newValue))
        } catch {
          getStorageRuntime().progressRepository.repair()
          applySnapshot(createInitialProgress())
        }
      })
    }

    return {
      schemaVersion,
      contentVersion,
      userId,
      lessonProgress,
      skillProgress,
      exerciseAttempts,
      reviewQueue,
      lastImportPreview,
      lastBackupKey,
      snapshot,
      attemptCount,
      applySnapshot,
      recordAttempt,
      exportProgress,
      previewImport,
      importProgress,
      recoverFromStoredState,
      clearPersonalAnswers,
      resetProgress,
      fullReset,
      startStorageSync,
    }
  },
  {
    persist: {
      key: storageKeys.progress,
      pick: [
        'schemaVersion',
        'contentVersion',
        'userId',
        'lessonProgress',
        'skillProgress',
        'exerciseAttempts',
        'reviewQueue',
      ],
      storage: runtimePiniaStorage,
    },
  },
)
