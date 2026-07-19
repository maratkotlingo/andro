import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, nextTick } from 'vue'
import type { DiagnosticResult, ExerciseAttempt, ReviewItem } from '../domain/model'
import { createEmptyUserProgress } from '../domain/model/defaults'
import {
  configureStorageRuntime,
  createMemoryBrowserStorage,
  createStorageRuntime,
  getStorageRuntime,
  resetStorageRuntime,
  stableJson,
  storageKeys,
  type MemoryBrowserStorage,
  type StorageRuntime,
} from '../services/storage'
import { useContentStore } from './content'
import { useDiagnosticStore } from './diagnostic'
import { useProgressStore } from './progress'
import { useReviewStore } from './review'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'

const now = '2026-07-19T00:00:00.000Z'
const contentVersion = '2026.07.foundation'

type StoreHarness = {
  runtime: StorageRuntime
  storage: MemoryBrowserStorage
}

function installPiniaWithMemoryStorage(): StoreHarness {
  const storage = createMemoryBrowserStorage()
  const runtime = createStorageRuntime(storage, 0)
  configureStorageRuntime(runtime)

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({}).use(pinia)
  setActivePinia(pinia)

  return { runtime, storage }
}

function createCorrectAttempt(): ExerciseAttempt {
  return {
    id: 'attempt.single-choice.val-var',
    exerciseId: 'exercise.single-choice.val-var',
    lessonId: 'lesson.kotlin-values',
    answeredAt: now,
    usedHintIds: [],
    answer: 'option.val',
    result: {
      status: 'correct',
      score: 1,
      checkerKind: 'single-choice',
      matchedRules: ['option.val'],
      failedRules: [],
      feedback: 'Выбран неизменяемый binding.',
    },
  }
}

beforeEach(() => {
  resetStorageRuntime()
})

describe('Pinia stores', () => {
  it('persists settings through the runtime storage adapter and applies theme changes', async () => {
    const { runtime } = installPiniaWithMemoryStorage()
    const settings = useSettingsStore()

    settings.setTheme('dark')
    settings.setCodeFontSize(18)
    settings.startThemeSync()
    await nextTick()

    expect(settings.snapshot).toMatchObject({
      theme: 'dark',
      codeFontSize: 18,
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(runtime.storage.getRaw(storageKeys.settings)).toContain('"theme":"dark"')
  })

  it('exports, previews, imports and clears progress without storing static content', () => {
    installPiniaWithMemoryStorage()
    const settings = useSettingsStore()
    const progress = useProgressStore()
    const attempt = createCorrectAttempt()

    progress.recordAttempt(attempt)
    expect(progress.attemptCount).toBe(1)
    expect(progress.lessonProgress['lesson.kotlin-values']?.completedExerciseIds).toContain(
      attempt.exerciseId,
    )

    const exported = progress.exportProgress(settings.snapshot)
    const preview = progress.previewImport(exported)
    progress.resetProgress()

    expect(preview.valid).toBe(true)
    expect(exported).not.toContain('"exercises"')
    expect(progress.attemptCount).toBe(0)
    expect(progress.importProgress(exported, true)).toBe(true)
    expect(progress.attemptCount).toBe(1)
    expect(progress.lastBackupKey).toContain(storageKeys.backupPrefix)

    progress.clearPersonalAnswers()
    expect(progress.attemptCount).toBe(0)
  })

  it('syncs settings and progress from storage events and repairs corrupted JSON', () => {
    const { storage } = installPiniaWithMemoryStorage()
    const settings = useSettingsStore()
    const progress = useProgressStore()
    const remoteProgress = createEmptyUserProgress(now, contentVersion)
    const attempt = createCorrectAttempt()
    remoteProgress.exerciseAttempts = {
      [attempt.id]: attempt,
    }

    settings.startStorageSync()
    progress.startStorageSync()
    storage.emitExternalChange(
      storageKeys.settings,
      stableJson({ ...settings.snapshot, theme: 'light' }),
    )
    storage.emitExternalChange(storageKeys.progress, stableJson(remoteProgress))

    expect(settings.theme).toBe('light')
    expect(progress.attemptCount).toBe(1)

    storage.emitExternalChange(storageKeys.progress, '{broken-json')

    expect(progress.attemptCount).toBe(0)
    expect(getStorageRuntime().backups.latest()?.reason).toBe('corrupted progress')
  })

  it('loads content, derives review queues, saves diagnostics and manages UI toasts', async () => {
    installPiniaWithMemoryStorage()
    const content = useContentStore()
    const progress = useProgressStore()
    const review = useReviewStore()
    const diagnostic = useDiagnosticStore()
    const ui = useUiStore()
    const reviewItem: ReviewItem = {
      id: 'review.skill.val-var',
      skillId: 'skill.val-var',
      exerciseId: 'exercise.single-choice.val-var',
      lessonId: 'lesson.kotlin-values',
      schedule: {
        intervalDays: 0,
        ease: 2.3,
        dueAt: '2020-01-01T00:00:00.000Z',
      },
      state: 'queued',
    }
    const diagnosticResult: DiagnosticResult = {
      id: 'diagnostic.local',
      completedAt: now,
      recommendedModuleId: 'module.kotlin-foundations',
      skillScores: {
        'skill.val-var': 0.6,
      },
      exerciseAttemptIds: ['attempt.single-choice.val-var'],
    }

    await content.load()
    progress.reviewQueue = [reviewItem]
    review.suspend(reviewItem.id)
    diagnostic.saveResult(diagnosticResult)
    const toastId = ui.notify({
      tone: 'success',
      title: 'Сохранено',
      description: 'Проверка UI store.',
    })
    ui.dismiss(toastId)

    expect(content.ready).toBe(true)
    expect(content.registry?.exercises.size).toBe(17)
    expect(review.due).toHaveLength(1)
    expect(progress.reviewQueue[0]?.state).toBe('suspended')
    expect(diagnostic.latestResult?.recommendedModuleId).toBe('module.kotlin-foundations')
    expect(ui.toasts).toEqual([])
  })
})
