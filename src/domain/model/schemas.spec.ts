import { describe, expect, it } from 'vitest'
import { contentManifest } from '../../content/manifest'
import foundationsPackage from '../../content/sections/foundations'
import { createDefaultUserPreferences, createEmptyUserProgress } from './defaults'
import {
  contentManifestSchema,
  contentPackageSchema,
  exerciseSchema,
  migrationEnvelopeSchema,
  progressExportSchema,
  userPreferencesSchema,
  userProgressSchema,
  type Exercise,
} from './schemas'

const expectedExerciseKinds = [
  'single-choice',
  'multiple-choice',
  'true-false',
  'token-ordering',
  'micro-parsons',
  'line-parsons',
  'fill-in-the-blanks',
  'output-prediction',
  'type-prediction',
  'code-debugging',
  'code-writing',
  'code-refactoring',
  'concept-matching',
  'execution-tracing',
  'scenario-based-transfer',
  'project-step',
  'self-check-question',
] as const satisfies readonly Exercise['kind'][]

function requireExercise<K extends Exercise['kind']>(kind: K): Extract<Exercise, { kind: K }> {
  const packageFixture = contentPackageSchema.parse(foundationsPackage)
  const exercise = packageFixture.exercises.find(
    (item): item is Extract<Exercise, { kind: K }> => item.kind === kind,
  )
  if (!exercise) {
    throw new Error(`Missing fixture exercise: ${kind}`)
  }

  return exercise
}

describe('domain Zod schemas', () => {
  it('validates the full content package and every exercise kind', () => {
    const parsed = contentPackageSchema.parse(foundationsPackage)
    const actualKinds = new Set(parsed.exercises.map((exercise) => exercise.kind))

    expect(parsed.course.id).toBe('kotlin-core')
    expect(actualKinds).toEqual(new Set(expectedExerciseKinds))
  })

  it('rejects an exercise with a checker config from another discriminated branch', () => {
    const exercise = requireExercise('single-choice')
    const result = exerciseSchema.safeParse({
      ...exercise,
      checker: {
        kind: 'multiple-choice',
        correctOptionIds: [exercise.checker.correctOptionId],
        requireExact: true,
      },
    })

    expect(result.success).toBe(false)
  })

  it('validates settings, progress import payloads, migrations and manifest files', () => {
    const now = '2026-07-19T00:00:00.000Z'
    const settings = createDefaultUserPreferences()
    const progress = createEmptyUserProgress(now, foundationsPackage.contentVersion)

    expect(userPreferencesSchema.parse(settings)).toEqual(settings)
    expect(userProgressSchema.parse(progress)).toEqual(progress)
    expect(contentManifestSchema.parse(contentManifest)).toEqual(contentManifest)
    expect(
      progressExportSchema.safeParse({
        schemaVersion: 1,
        contentVersion: progress.contentVersion,
        exportedAt: now,
        checksum: 'checksum-fixture',
        progress,
        settings,
      }).success,
    ).toBe(true)
    expect(
      migrationEnvelopeSchema.parse({
        schemaVersion: 1,
        records: [
          {
            fromVersion: 0,
            toVersion: 1,
            migratedAt: now,
            notes: ['fixture migration'],
          },
        ],
      }).records,
    ).toHaveLength(1)
  })
})
