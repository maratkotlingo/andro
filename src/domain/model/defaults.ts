import { currentContentVersion } from '../../content/manifest'
import type { LearningSession, UserPreferences, UserProgress } from './schemas'

export const SETTINGS_SCHEMA_VERSION = 1
export const PROGRESS_SCHEMA_VERSION = 1
export const SESSION_SCHEMA_VERSION = 1

export function createDefaultUserPreferences(): UserPreferences {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    theme: 'system',
    reducedMotion: 'system',
    codeFontSize: 14,
  }
}

export function createEmptyUserProgress(
  nowIso: string,
  contentVersion = currentContentVersion,
): UserProgress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    contentVersion,
    userId: 'local',
    lessonProgress: {
      'lesson.kotlin-values': {
        lessonId: 'lesson.kotlin-values',
        completedExerciseIds: [],
        mastery: 0,
        updatedAt: nowIso,
      },
    },
    skillProgress: {},
    exerciseAttempts: {},
    reviewQueue: [],
  }
}

export function createLearningSession(nowIso: string): LearningSession {
  return {
    id: 'session.local',
    startedAt: nowIso,
    activeLessonId: 'lesson.kotlin-values',
    completedExerciseIds: [],
    minutesSpent: 0,
  }
}
