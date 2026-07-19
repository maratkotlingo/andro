import { z } from 'zod'

export const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/)
export const isoDateSchema = z.string().datetime({ offset: true })
export const difficultySchema = z.number().int().min(1).max(5)
export const checkerKindSchema = z.enum([
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
])

export const contentVersionSchema = z.object({
  schemaVersion: z.number().int().min(1),
  contentVersion: z.string().min(1),
  releasedAt: isoDateSchema,
})

export const hintSchema = z.object({
  id: idSchema,
  level: z.number().int().min(1).max(4),
  body: z.string().min(1),
})

export const explanationSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  code: z.string().optional(),
})

export const misconceptionSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  symptom: z.string().min(1),
  correction: z.string().min(1),
})

export const skillDependencySchema = z.object({
  fromSkillId: idSchema,
  toSkillId: idSchema,
  kind: z.enum(['prerequisite', 'supports', 'review-before']),
})

export const skillSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  area: z.string().min(1),
  dependencies: z.array(skillDependencySchema),
})

export const conceptSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  skillIds: z.array(idSchema).min(1),
  misconceptionIds: z.array(idSchema),
})

export const exampleSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  title: z.string().min(1),
  code: z.string().min(1),
  explanationId: idSchema,
})

export const exerciseBaseSchema = z.object({
  id: idSchema,
  lessonId: idSchema,
  skillIds: z.array(idSchema).min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  difficulty: difficultySchema,
  estimatedSeconds: z.number().int().positive(),
  hints: z.array(hintSchema),
  explanationId: idSchema,
})

const optionSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
})

const singleChoiceCheckerSchema = z.object({
  kind: z.literal('single-choice'),
  correctOptionId: idSchema,
})

const multipleChoiceCheckerSchema = z.object({
  kind: z.literal('multiple-choice'),
  correctOptionIds: z.array(idSchema).min(1),
  requireExact: z.boolean(),
})

const trueFalseCheckerSchema = z.object({
  kind: z.literal('true-false'),
  expected: z.boolean(),
  explanationRequired: z.boolean(),
})

const tokenOrderingCheckerSchema = z.object({
  kind: z.literal('token-ordering'),
  expectedTokens: z.array(z.string().min(1)).min(1),
  allowExtraWhitespace: z.boolean(),
})

const microParsonsCheckerSchema = z.object({
  kind: z.literal('micro-parsons'),
  expectedFragmentIds: z.array(idSchema).min(1),
})

const lineParsonsCheckerSchema = z.object({
  kind: z.literal('line-parsons'),
  expectedLineIds: z.array(idSchema).min(1),
  indentationSensitive: z.boolean(),
})

const fillBlanksCheckerSchema = z.object({
  kind: z.literal('fill-in-the-blanks'),
  blanks: z.array(
    z.object({
      blankId: idSchema,
      acceptedAnswers: z.array(z.string().min(1)).min(1),
      caseSensitive: z.boolean(),
    }),
  ),
})

const outputPredictionCheckerSchema = z.object({
  kind: z.literal('output-prediction'),
  expectedOutput: z.string(),
  normalizeWhitespace: z.boolean(),
})

const typePredictionCheckerSchema = z.object({
  kind: z.literal('type-prediction'),
  expectedType: z.string().min(1),
  acceptedAliases: z.array(z.string().min(1)),
})

const codeDebuggingCheckerSchema = z.object({
  kind: z.literal('code-debugging'),
  requiredFixes: z.array(z.string().min(1)).min(1),
  forbiddenPatterns: z.array(z.string().min(1)),
})

const codeWritingCheckerSchema = z.object({
  kind: z.literal('code-writing'),
  requiredConstructs: z.array(z.string().min(1)),
  forbiddenConstructs: z.array(z.string().min(1)),
  expectedTokens: z.array(z.string().min(1)).optional(),
})

const codeRefactoringCheckerSchema = z.object({
  kind: z.literal('code-refactoring'),
  preservedBehaviorCases: z.array(z.string().min(1)).min(1),
  requiredChanges: z.array(z.string().min(1)).min(1),
})

const conceptMatchingCheckerSchema = z.object({
  kind: z.literal('concept-matching'),
  pairs: z
    .array(
      z.object({
        leftId: idSchema,
        rightId: idSchema,
      }),
    )
    .min(1),
})

const executionTracingCheckerSchema = z.object({
  kind: z.literal('execution-tracing'),
  expectedSteps: z.array(z.string().min(1)).min(1),
})

const scenarioTransferCheckerSchema = z.object({
  kind: z.literal('scenario-based-transfer'),
  requiredConceptIds: z.array(idSchema).min(1),
  acceptedSolutionIds: z.array(idSchema).min(1),
})

const projectStepCheckerSchema = z.object({
  kind: z.literal('project-step'),
  requiredArtifacts: z.array(z.string().min(1)).min(1),
  acceptanceRules: z.array(z.string().min(1)).min(1),
})

const selfCheckCheckerSchema = z.object({
  kind: z.literal('self-check-question'),
  requiredReflectionIds: z.array(idSchema),
  minLength: z.number().int().min(0),
})

export const checkerConfigSchema = z.discriminatedUnion('kind', [
  singleChoiceCheckerSchema,
  multipleChoiceCheckerSchema,
  trueFalseCheckerSchema,
  tokenOrderingCheckerSchema,
  microParsonsCheckerSchema,
  lineParsonsCheckerSchema,
  fillBlanksCheckerSchema,
  outputPredictionCheckerSchema,
  typePredictionCheckerSchema,
  codeDebuggingCheckerSchema,
  codeWritingCheckerSchema,
  codeRefactoringCheckerSchema,
  conceptMatchingCheckerSchema,
  executionTracingCheckerSchema,
  scenarioTransferCheckerSchema,
  projectStepCheckerSchema,
  selfCheckCheckerSchema,
])

export const exerciseSchema = z.discriminatedUnion('kind', [
  exerciseBaseSchema.extend({
    kind: z.literal('single-choice'),
    options: z.array(optionSchema).min(2),
    checker: singleChoiceCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('multiple-choice'),
    options: z.array(optionSchema).min(2),
    checker: multipleChoiceCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('true-false'),
    statement: z.string().min(1),
    checker: trueFalseCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('token-ordering'),
    tokens: z.array(z.string().min(1)).min(1),
    checker: tokenOrderingCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('micro-parsons'),
    fragments: z.array(optionSchema).min(2),
    checker: microParsonsCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('line-parsons'),
    lines: z.array(optionSchema).min(2),
    checker: lineParsonsCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('fill-in-the-blanks'),
    template: z.string().min(1),
    checker: fillBlanksCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('output-prediction'),
    code: z.string().min(1),
    checker: outputPredictionCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('type-prediction'),
    expression: z.string().min(1),
    checker: typePredictionCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('code-debugging'),
    brokenCode: z.string().min(1),
    checker: codeDebuggingCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('code-writing'),
    starterCode: z.string(),
    checker: codeWritingCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('code-refactoring'),
    originalCode: z.string().min(1),
    checker: codeRefactoringCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('concept-matching'),
    leftItems: z.array(optionSchema).min(1),
    rightItems: z.array(optionSchema).min(1),
    checker: conceptMatchingCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('execution-tracing'),
    code: z.string().min(1),
    checkpoints: z.array(z.string().min(1)).min(1),
    checker: executionTracingCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('scenario-based-transfer'),
    scenario: z.string().min(1),
    checker: scenarioTransferCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('project-step'),
    projectContext: z.string().min(1),
    checker: projectStepCheckerSchema,
  }),
  exerciseBaseSchema.extend({
    kind: z.literal('self-check-question'),
    question: z.string().min(1),
    checker: selfCheckCheckerSchema,
  }),
])

export const lessonSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().min(0),
  conceptIds: z.array(idSchema),
  exampleIds: z.array(idSchema),
  exerciseIds: z.array(idSchema).min(1),
  skillIds: z.array(idSchema).min(1),
  estimatedMinutes: z.number().int().positive(),
})

export const moduleSchema = z.object({
  id: idSchema,
  slug: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().min(0),
  lessonIds: z.array(idSchema).min(1),
  skillIds: z.array(idSchema).min(1),
  prerequisiteModuleIds: z.array(idSchema),
})

export const courseSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  contentVersion: z.string().min(1),
  moduleIds: z.array(idSchema).min(1),
  diagnosticExerciseIds: z.array(idSchema),
})

export const contentManifestSchema = z.object({
  schemaVersion: z.number().int().min(1),
  contentVersion: z.string().min(1),
  courseId: idSchema,
  sections: z.array(
    z.object({
      id: idSchema,
      title: z.string().min(1),
      moduleIds: z.array(idSchema).min(1),
    }),
  ),
})

export const contentPackageSchema = z.object({
  schemaVersion: z.number().int().min(1),
  contentVersion: z.string().min(1),
  sectionId: idSchema,
  course: courseSchema,
  modules: z.array(moduleSchema).min(1),
  skills: z.array(skillSchema).min(1),
  concepts: z.array(conceptSchema),
  examples: z.array(exampleSchema),
  lessons: z.array(lessonSchema).min(1),
  exercises: z.array(exerciseSchema).min(1),
  explanations: z.array(explanationSchema).min(1),
  misconceptions: z.array(misconceptionSchema),
})

export const exerciseResultSchema = z.object({
  status: z.enum(['correct', 'partially-correct', 'incorrect', 'skipped']),
  score: z.number().min(0).max(1),
  checkerKind: checkerKindSchema,
  matchedRules: z.array(z.string()),
  failedRules: z.array(z.string()),
  feedback: z.string(),
})

export const exerciseAttemptSchema = z.object({
  id: idSchema,
  exerciseId: idSchema,
  lessonId: idSchema,
  startedAt: isoDateSchema.optional(),
  answeredAt: isoDateSchema,
  durationSeconds: z.number().int().min(0).optional(),
  usedHintIds: z.array(idSchema),
  viewedSolution: z.boolean().optional(),
  selfReproduced: z.boolean().optional(),
  misconceptionTags: z.array(idSchema).optional(),
  isReview: z.boolean().optional(),
  quality: z.enum(['again', 'hard', 'good', 'easy']).optional(),
  answer: z.unknown(),
  result: exerciseResultSchema,
})

export const reviewScheduleSchema = z.object({
  intervalDays: z.number().int().min(0),
  intervalMinutes: z.number().int().min(10).optional(),
  ease: z.number().min(1.3).max(2.8),
  dueAt: isoDateSchema,
  lastReviewedAt: isoDateSchema.optional(),
})

export const reviewItemSchema = z.object({
  id: idSchema,
  skillId: idSchema,
  exerciseId: idSchema,
  lessonId: idSchema,
  schedule: reviewScheduleSchema,
  state: z.enum(['queued', 'due', 'suspended']),
})

export const learningSessionSchema = z.object({
  id: idSchema,
  startedAt: isoDateSchema,
  activeLessonId: idSchema,
  completedExerciseIds: z.array(idSchema),
  minutesSpent: z.number().int().min(0),
})

export const diagnosticResultSchema = z.object({
  id: idSchema,
  completedAt: isoDateSchema,
  recommendedModuleId: idSchema,
  skillScores: z.record(idSchema, z.number().min(0).max(1)),
  exerciseAttemptIds: z.array(idSchema),
})

export const userPreferencesSchema = z.object({
  schemaVersion: z.number().int().min(1),
  theme: z.enum(['light', 'dark', 'system']),
  reducedMotion: z.enum(['system', 'always', 'never']),
  codeFontSize: z.number().int().min(12).max(22),
})

export const userProgressSchema = z.object({
  schemaVersion: z.number().int().min(1),
  contentVersion: z.string().min(1),
  userId: z.literal('local'),
  lessonProgress: z.record(
    idSchema,
    z.object({
      lessonId: idSchema,
      completedExerciseIds: z.array(idSchema),
      mastery: z.number().min(0).max(1),
      updatedAt: isoDateSchema,
    }),
  ),
  skillProgress: z.record(
    idSchema,
    z.object({
      skillId: idSchema,
      score: z.number().min(0).max(1),
      correctWithoutHints: z.number().int().min(0),
      correctWithHints: z.number().int().min(0),
      debugCorrect: z.number().int().min(0),
      transferCorrect: z.number().int().min(0),
      reviewCorrect: z.number().int().min(0),
      lastPracticedAt: isoDateSchema.optional(),
      nextReviewAt: isoDateSchema.optional(),
      intervalDays: z.number().int().min(0),
      ease: z.number().min(1.3).max(2.8),
    }),
  ),
  exerciseAttempts: z.record(idSchema, exerciseAttemptSchema),
  reviewQueue: z.array(reviewItemSchema),
})

export const appStateSchema = z.object({
  settings: userPreferencesSchema,
  progress: userProgressSchema,
  session: learningSessionSchema.optional(),
  diagnostic: diagnosticResultSchema.optional(),
})

export const progressExportSchema = z.object({
  schemaVersion: z.number().int().min(1),
  contentVersion: z.string().min(1),
  exportedAt: isoDateSchema,
  checksum: z.string().min(1),
  progress: userProgressSchema,
  settings: userPreferencesSchema,
})

export const migrationRecordSchema = z.object({
  fromVersion: z.number().int().min(0),
  toVersion: z.number().int().min(1),
  migratedAt: isoDateSchema,
  notes: z.array(z.string()),
})

export const migrationEnvelopeSchema = z.object({
  schemaVersion: z.number().int().min(1),
  records: z.array(migrationRecordSchema),
})

export type ContentVersion = z.infer<typeof contentVersionSchema>
export type Hint = z.infer<typeof hintSchema>
export type Explanation = z.infer<typeof explanationSchema>
export type Misconception = z.infer<typeof misconceptionSchema>
export type SkillDependency = z.infer<typeof skillDependencySchema>
export type Skill = z.infer<typeof skillSchema>
export type Concept = z.infer<typeof conceptSchema>
export type Example = z.infer<typeof exampleSchema>
export type CheckerConfig = z.infer<typeof checkerConfigSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type Module = z.infer<typeof moduleSchema>
export type Course = z.infer<typeof courseSchema>
export type ContentManifest = z.infer<typeof contentManifestSchema>
export type ContentPackage = z.infer<typeof contentPackageSchema>
export type ExerciseResult = z.infer<typeof exerciseResultSchema>
export type ExerciseAttempt = z.infer<typeof exerciseAttemptSchema>
export type ReviewSchedule = z.infer<typeof reviewScheduleSchema>
export type ReviewItem = z.infer<typeof reviewItemSchema>
export type LearningSession = z.infer<typeof learningSessionSchema>
export type DiagnosticResult = z.infer<typeof diagnosticResultSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type UserProgress = z.infer<typeof userProgressSchema>
export type AppState = z.infer<typeof appStateSchema>
export type ProgressExport = z.infer<typeof progressExportSchema>
export type MigrationRecord = z.infer<typeof migrationRecordSchema>
