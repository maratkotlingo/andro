import {
  PROGRESS_SCHEMA_VERSION,
  SETTINGS_SCHEMA_VERSION,
  createDefaultUserPreferences,
  createEmptyUserProgress,
} from '../../../domain/model/defaults'
import {
  migrationEnvelopeSchema,
  userPreferencesSchema,
  userProgressSchema,
  type MigrationRecord,
  type UserPreferences,
  type UserProgress,
} from '../../../domain/model'

export type MigrationResult<T> = {
  value: T
  records: readonly MigrationRecord[]
}

function migrationRecord(
  fromVersion: number,
  toVersion: number,
  notes: readonly string[],
  nowIso: string,
): MigrationRecord {
  return {
    fromVersion,
    toVersion,
    migratedAt: nowIso,
    notes: [...notes],
  }
}

export function migrateUserPreferences(
  input: unknown,
  nowIso: string,
): MigrationResult<UserPreferences> {
  const parsed = userPreferencesSchema.safeParse(input)
  if (parsed.success && parsed.data.schemaVersion === SETTINGS_SCHEMA_VERSION) {
    return {
      value: parsed.data,
      records: [],
    }
  }

  const legacy = typeof input === 'object' && input !== null ? input : {}
  const theme = 'theme' in legacy ? legacy.theme : undefined
  const migratedTheme: UserPreferences['theme'] =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'
  const next: UserPreferences = {
    ...createDefaultUserPreferences(),
    theme: migratedTheme,
  }

  return {
    value: next,
    records: [
      migrationRecord(0, SETTINGS_SCHEMA_VERSION, ['settings normalized to schema v1'], nowIso),
    ],
  }
}

export function migrateUserProgress(
  input: unknown,
  nowIso: string,
  contentVersion: string,
): MigrationResult<UserProgress> {
  const parsed = userProgressSchema.safeParse(input)
  if (parsed.success && parsed.data.schemaVersion === PROGRESS_SCHEMA_VERSION) {
    if (parsed.data.contentVersion === contentVersion) {
      return {
        value: parsed.data,
        records: [],
      }
    }

    return {
      value: {
        ...parsed.data,
        contentVersion,
      },
      records: [
        migrationRecord(
          parsed.data.schemaVersion,
          PROGRESS_SCHEMA_VERSION,
          [`contentVersion updated from ${parsed.data.contentVersion} to ${contentVersion}`],
          nowIso,
        ),
      ],
    }
  }

  const legacy = typeof input === 'object' && input !== null ? input : {}
  const activeLessonId =
    'activeLessonId' in legacy && typeof legacy.activeLessonId === 'string'
      ? legacy.activeLessonId
      : 'lesson.kotlin-values'
  const empty = createEmptyUserProgress(nowIso, contentVersion)

  return {
    value: {
      ...empty,
      lessonProgress: {
        ...empty.lessonProgress,
        [activeLessonId]: {
          lessonId: activeLessonId,
          completedExerciseIds: [],
          mastery: 0,
          updatedAt: nowIso,
        },
      },
    },
    records: [
      migrationRecord(
        0,
        PROGRESS_SCHEMA_VERSION,
        ['progress initialized from legacy state'],
        nowIso,
      ),
    ],
  }
}

export function createMigrationEnvelope(records: readonly MigrationRecord[]) {
  return migrationEnvelopeSchema.parse({
    schemaVersion: 1,
    records,
  })
}
