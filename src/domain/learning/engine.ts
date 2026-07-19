import type {
  ContentPackage,
  Exercise,
  ExerciseAttempt,
  Lesson,
  Module,
  ReviewItem,
  ReviewSchedule,
  Skill,
  UserProgress,
} from '../model'

const minuteMs = 60 * 1000
const dayMs = 24 * 60 * 60 * 1000
const masteryThreshold = 0.78
const fragileThreshold = 0.52
const baseReviewIntervalsMinutes = [10, 1_440, 4_320, 10_080, 30_240, 86_400] as const

export const hintLevelLabels = {
  1: 'conceptual-direction',
  2: 'construction-part',
  3: 'partial-solution',
  4: 'full-explanation',
} as const

export type HintLevel = keyof typeof hintLevelLabels
export type HintLevelLabel = (typeof hintLevelLabels)[HintLevel]
export type PracticeQuality = 'again' | 'hard' | 'good' | 'easy'
export type SkillStatus =
  | 'locked'
  | 'available'
  | 'introduced'
  | 'practicing'
  | 'fragile'
  | 'mastered'
  | 'review-due'
  | 'decayed'

export type SessionMode =
  | 'guided-lesson'
  | 'daily-review'
  | 'weak-skills-practice'
  | 'rapid-syntax-drill'
  | 'debugging-practice'
  | 'transfer-practice'
  | 'module-assessment'
  | 'diagnostic-session'

export type Clock = {
  now(): Date
}

export type LearningContent = {
  courseDiagnosticExerciseIds: readonly string[]
  modules: readonly Module[]
  skills: readonly Skill[]
  lessons: readonly Lesson[]
  exercises: readonly Exercise[]
}

export type SkillMasteryRequirements = {
  independentAnswers: number
  exerciseKinds: number
  hasDebugging: boolean
  hasTransfer: boolean
  hasDelayedReview: boolean
  readyForMastery: boolean
}

export type SkillMasteryProfile = {
  skillId: string
  status: SkillStatus
  score: number
  attempts: number
  accuracy: number
  firstAttemptScore: number
  independentCorrect: number
  hintCount: number
  totalHintCost: number
  averageHintCost: number
  viewedSolutionCount: number
  selfReproductionCorrect: number
  debugCorrect: number
  transferCorrect: number
  answerSpeedScore: number
  recencyDays: number | null
  successfulDelayedReviews: number
  repeatedMisconceptionTags: readonly string[]
  successStreak: number
  exerciseKindCount: number
  averageDifficulty: number
  lastPracticedAt: string | null
  nextReviewAt: string | null
  dueByMinutes: number | null
  requirements: SkillMasteryRequirements
}

export type SpacedRepetitionState = {
  intervalIndex: number
  intervalMinutes: number
  intervalDays: number
  ease: number
  dueAt: string
  lastReviewedAt: string
  successfulReviews: number
  lapses: number
}

export type ExerciseRecommendation = {
  exerciseId: string
  lessonId: string
  primarySkillId: string
  mode: SessionMode
  score: number
  reasons: readonly string[]
}

type ContentMaps = {
  modulesById: ReadonlyMap<string, Module>
  skillsById: ReadonlyMap<string, Skill>
  lessonsById: ReadonlyMap<string, Lesson>
  exercisesById: ReadonlyMap<string, Exercise>
  prerequisiteSkillIdsBySkill: ReadonlyMap<string, readonly string[]>
}

export const systemClock: Clock = {
  now() {
    return new Date()
  },
}

export function fixedClock(isoInstant: string): Clock {
  const timestamp = Date.parse(isoInstant)
  return {
    now() {
      return new Date(timestamp)
    },
  }
}

export function learningContentFromPackage(contentPackage: ContentPackage): LearningContent {
  return {
    courseDiagnosticExerciseIds: contentPackage.course.diagnosticExerciseIds,
    modules: contentPackage.modules,
    skills: contentPackage.skills,
    lessons: contentPackage.lessons,
    exercises: contentPackage.exercises,
  }
}

export function hintCostForLevel(level: number): number {
  if (level <= 1) return 0.12
  if (level === 2) return 0.25
  if (level === 3) return 0.45
  return 0.72
}

export function scheduleNextReview(input: {
  quality: PracticeQuality
  clock: Clock
  previous?: Partial<SpacedRepetitionState> | ReviewSchedule
}): SpacedRepetitionState {
  const now = input.clock.now()
  const previousIndex = inferPreviousIntervalIndex(input.previous)
  const previousInterval = inferPreviousIntervalMinutes(input.previous, previousIndex)
  const previousEase = input.previous?.ease ?? 2.3
  const nextIndex = nextIntervalIndex(previousIndex, input.quality)
  const ease = clamp(
    previousEase + ({ again: -0.2, hard: -0.08, good: 0.02, easy: 0.12 }[input.quality] ?? 0),
    1.3,
    2.8,
  )
  const intervalMinutes =
    nextIndex >= baseReviewIntervalsMinutes.length - 1 &&
    previousIndex >= baseReviewIntervalsMinutes.length - 1 &&
    (input.quality === 'good' || input.quality === 'easy')
      ? Math.round(previousInterval * ease * (input.quality === 'easy' ? 1.25 : 1))
      : reviewIntervalAt(nextIndex)
  const previousSuccesses =
    'successfulReviews' in (input.previous ?? {})
      ? ((input.previous as Partial<SpacedRepetitionState>).successfulReviews ?? 0)
      : 0
  const previousLapses =
    'lapses' in (input.previous ?? {})
      ? ((input.previous as Partial<SpacedRepetitionState>).lapses ?? 0)
      : 0

  return {
    intervalIndex: nextIndex,
    intervalMinutes,
    intervalDays: Math.floor(intervalMinutes / 1_440),
    ease,
    dueAt: new Date(now.getTime() + intervalMinutes * minuteMs).toISOString(),
    lastReviewedAt: now.toISOString(),
    successfulReviews: previousSuccesses + (input.quality === 'again' ? 0 : 1),
    lapses: previousLapses + (input.quality === 'again' ? 1 : 0),
  }
}

export function computeSkillMasteryProfiles(input: {
  content: LearningContent
  progress: UserProgress
  clock: Clock
}): readonly SkillMasteryProfile[] {
  const maps = createContentMaps(input.content)
  const rawProfiles = new Map<string, SkillMasteryProfile>()

  for (const skill of input.content.skills) {
    rawProfiles.set(
      skill.id,
      computeRawSkillMastery({
        skillId: skill.id,
        content: input.content,
        maps,
        progress: input.progress,
        clock: input.clock,
      }),
    )
  }

  const statuses = computeStatusesWithPrerequisites(input.content.skills, rawProfiles, maps)
  return input.content.skills.map((skill) => {
    const profile = rawProfiles.get(skill.id)
    if (!profile) {
      throw new Error(`Missing computed mastery profile for ${skill.id}`)
    }

    return {
      ...profile,
      status: statuses.get(skill.id) ?? profile.status,
    }
  })
}

export function computeSkillMastery(input: {
  skillId: string
  content: LearningContent
  progress: UserProgress
  clock: Clock
}): SkillMasteryProfile {
  const profile = computeSkillMasteryProfiles(input).find((item) => item.skillId === input.skillId)
  if (!profile) {
    throw new Error(`Unknown skill: ${input.skillId}`)
  }

  return profile
}

export function updateProgressAfterAttempt(input: {
  content: LearningContent
  progress: UserProgress
  attempt: ExerciseAttempt
  clock: Clock
}): UserProgress {
  const maps = createContentMaps(input.content)
  const exercise = maps.exercisesById.get(input.attempt.exerciseId)
  if (!exercise) {
    return {
      ...input.progress,
      exerciseAttempts: {
        ...input.progress.exerciseAttempts,
        [input.attempt.id]: input.attempt,
      },
    }
  }

  const nextProgress: UserProgress = {
    ...input.progress,
    lessonProgress: { ...input.progress.lessonProgress },
    skillProgress: { ...input.progress.skillProgress },
    exerciseAttempts: {
      ...input.progress.exerciseAttempts,
      [input.attempt.id]: input.attempt,
    },
    reviewQueue: [...input.progress.reviewQueue],
  }
  const previousLesson = nextProgress.lessonProgress[input.attempt.lessonId]
  nextProgress.lessonProgress[input.attempt.lessonId] = {
    lessonId: input.attempt.lessonId,
    completedExerciseIds:
      input.attempt.result.status === 'correct'
        ? Array.from(
            new Set([...(previousLesson?.completedExerciseIds ?? []), input.attempt.exerciseId]),
          )
        : (previousLesson?.completedExerciseIds ?? []),
    mastery: previousLesson?.mastery ?? 0,
    updatedAt: input.attempt.answeredAt,
  }

  const quality = input.attempt.quality ?? qualityFromAttempt(input.attempt)
  for (const skillId of exercise.skillIds) {
    const previousSkill = input.progress.skillProgress[skillId]
    const previousReviewSchedule = previousSkill
      ? previousReviewScheduleFromProgress(previousSkill, input.attempt.answeredAt)
      : null
    const reviewState = previousReviewSchedule
      ? scheduleNextReview({
          quality,
          clock: input.clock,
          previous: previousReviewSchedule,
        })
      : scheduleNextReview({
          quality,
          clock: input.clock,
        })
    const profile = computeSkillMastery({
      skillId,
      content: input.content,
      progress: nextProgress,
      clock: input.clock,
    })

    nextProgress.skillProgress[skillId] = {
      skillId,
      score: profile.score,
      correctWithoutHints: profile.independentCorrect,
      correctWithHints: countCorrectWithHints(skillId, nextProgress, maps.exercisesById),
      debugCorrect: profile.debugCorrect,
      transferCorrect: profile.transferCorrect,
      reviewCorrect: profile.successfulDelayedReviews,
      lastPracticedAt: input.attempt.answeredAt,
      nextReviewAt: reviewState.dueAt,
      intervalDays: reviewState.intervalDays,
      ease: reviewState.ease,
    }

    nextProgress.reviewQueue = upsertReviewItem(nextProgress.reviewQueue, {
      id: `review.${skillId}`,
      skillId,
      exerciseId: input.attempt.exerciseId,
      lessonId: input.attempt.lessonId,
      schedule: {
        intervalDays: reviewState.intervalDays,
        intervalMinutes: reviewState.intervalMinutes,
        ease: reviewState.ease,
        dueAt: reviewState.dueAt,
        lastReviewedAt: reviewState.lastReviewedAt,
      },
      state: reviewState.dueAt <= input.clock.now().toISOString() ? 'due' : 'queued',
    })
  }

  const lessonProfileScores = exercise.skillIds
    .map((skillId) => nextProgress.skillProgress[skillId]?.score)
    .filter((score): score is number => typeof score === 'number')
  const updatedLessonProgress = nextProgress.lessonProgress[input.attempt.lessonId]
  nextProgress.lessonProgress[input.attempt.lessonId] = {
    lessonId: input.attempt.lessonId,
    completedExerciseIds: updatedLessonProgress?.completedExerciseIds ?? [],
    updatedAt: updatedLessonProgress?.updatedAt ?? input.attempt.answeredAt,
    mastery:
      lessonProfileScores.length > 0
        ? roundTo(
            lessonProfileScores.reduce((sum, score) => sum + score, 0) / lessonProfileScores.length,
          )
        : (updatedLessonProgress?.mastery ?? 0),
  }

  return nextProgress
}

export function selectNextExercise(input: {
  content: LearningContent
  progress: UserProgress
  clock: Clock
  mode: SessionMode
  currentLessonId?: string
  currentModuleId?: string
  recentExerciseIds?: readonly string[]
}): ExerciseRecommendation | null {
  return selectNextExercises({ ...input, limit: 1 })[0] ?? null
}

export function selectNextExercises(input: {
  content: LearningContent
  progress: UserProgress
  clock: Clock
  mode: SessionMode
  currentLessonId?: string
  currentModuleId?: string
  recentExerciseIds?: readonly string[]
  limit?: number
}): readonly ExerciseRecommendation[] {
  const maps = createContentMaps(input.content)
  const profiles = computeSkillMasteryProfiles(input)
  const profilesBySkill = new Map(profiles.map((profile) => [profile.skillId, profile]))
  const currentPrerequisiteGaps = collectCurrentPrerequisiteGaps(input, maps, profilesBySkill)
  const recentExerciseIds = input.recentExerciseIds ?? []
  const recentExercises = recentExerciseIds
    .map((exerciseId) => maps.exercisesById.get(exerciseId))
    .filter((exercise): exercise is Exercise => exercise !== undefined)

  return input.content.exercises
    .filter((exercise) =>
      isExerciseAvailable({
        exercise,
        maps,
        profilesBySkill,
        progress: input.progress,
      }),
    )
    .map((exercise) =>
      scoreExerciseCandidate({
        exercise,
        input,
        maps,
        profilesBySkill,
        currentPrerequisiteGaps,
        recentExercises,
        recentExerciseIds,
      }),
    )
    .filter((recommendation): recommendation is ExerciseRecommendation => recommendation !== null)
    .sort((left, right) => compareRecommendations(left, right, maps))
    .slice(0, input.limit ?? 5)
}

function createContentMaps(content: LearningContent): ContentMaps {
  const skillsById = new Map(content.skills.map((skill) => [skill.id, skill]))
  const prerequisiteSkillIdsBySkill = new Map<string, Set<string>>()

  for (const skill of content.skills) {
    if (!prerequisiteSkillIdsBySkill.has(skill.id)) {
      prerequisiteSkillIdsBySkill.set(skill.id, new Set())
    }

    for (const dependency of skill.dependencies) {
      if (dependency.kind !== 'prerequisite') {
        continue
      }

      const current = prerequisiteSkillIdsBySkill.get(dependency.fromSkillId) ?? new Set<string>()
      current.add(dependency.toSkillId)
      prerequisiteSkillIdsBySkill.set(dependency.fromSkillId, current)
    }
  }

  return {
    modulesById: new Map(content.modules.map((module) => [module.id, module])),
    skillsById,
    lessonsById: new Map(content.lessons.map((lesson) => [lesson.id, lesson])),
    exercisesById: new Map(content.exercises.map((exercise) => [exercise.id, exercise])),
    prerequisiteSkillIdsBySkill: new Map(
      Array.from(prerequisiteSkillIdsBySkill.entries()).map(([skillId, values]) => [
        skillId,
        Array.from(values).sort(),
      ]),
    ),
  }
}

function computeRawSkillMastery(input: {
  skillId: string
  content: LearningContent
  maps: ContentMaps
  progress: UserProgress
  clock: Clock
}): SkillMasteryProfile {
  const attempts = getAttemptsForSkill(input.skillId, input.progress, input.maps.exercisesById)
  const scoredAttempts = attempts.map((attempt) => {
    const exercise = input.maps.exercisesById.get(attempt.exerciseId)
    if (!exercise) {
      throw new Error(`Missing exercise for attempt ${attempt.id}`)
    }

    return {
      attempt,
      exercise,
      score: scoreAttempt(attempt, exercise),
      hintCost: computeHintCost(attempt, exercise),
      speedScore: computeAnswerSpeedScore(attempt, exercise),
    }
  })
  const correctAttempts = scoredAttempts.filter(
    ({ attempt }) => attempt.result.status === 'correct',
  )
  const independentCorrect = correctAttempts.filter(
    ({ attempt }) => attempt.usedHintIds.length === 0 && attempt.viewedSolution !== true,
  )
  const firstAttempts = firstAttemptPerExercise(scoredAttempts)
  const firstAttemptScore =
    firstAttempts.length === 0
      ? 0
      : firstAttempts.reduce(
          (sum, item) => sum + (item.attempt.result.status === 'correct' ? 1 : 0),
          0,
        ) / firstAttempts.length
  const hintCount = scoredAttempts.reduce((sum, item) => sum + item.attempt.usedHintIds.length, 0)
  const totalHintCost = scoredAttempts.reduce((sum, item) => sum + item.hintCost, 0)
  const viewedSolutionCount = scoredAttempts.filter(
    ({ attempt }) => attempt.viewedSolution === true,
  ).length
  const selfReproductionCorrect = correctAttempts.filter(
    ({ attempt, exercise }) =>
      attempt.selfReproduced === true ||
      exercise.kind === 'code-writing' ||
      exercise.kind === 'self-check-question',
  ).length
  const debugCorrect = correctAttempts.filter(
    ({ exercise, attempt }) =>
      exercise.kind === 'code-debugging' && attempt.viewedSolution !== true,
  ).length
  const transferCorrect = correctAttempts.filter(
    ({ exercise, attempt }) =>
      (exercise.kind === 'scenario-based-transfer' || exercise.kind === 'project-step') &&
      attempt.viewedSolution !== true,
  ).length
  const successfulDelayedReviews = correctAttempts.filter(
    ({ attempt }) => attempt.isReview === true,
  ).length
  const exerciseKindCount = new Set(correctAttempts.map(({ exercise }) => exercise.kind)).size
  const averageDifficulty =
    scoredAttempts.length === 0
      ? 0
      : scoredAttempts.reduce((sum, item) => sum + item.exercise.difficulty, 0) /
        scoredAttempts.length
  const answerSpeedScore =
    scoredAttempts.length === 0
      ? 0
      : scoredAttempts.reduce((sum, item) => sum + item.speedScore, 0) / scoredAttempts.length
  const repeatedMisconceptionTags = collectRepeatedMisconceptionTags(scoredAttempts)
  const successStreak = countSuccessStreak(scoredAttempts)
  const lastPracticedAt = scoredAttempts.at(-1)?.attempt.answeredAt ?? null
  const recencyDays =
    lastPracticedAt === null
      ? null
      : Math.max(0, (input.clock.now().getTime() - Date.parse(lastPracticedAt)) / dayMs)
  const nextReviewAt = getNextReviewAt(input.skillId, input.progress)
  const dueByMinutes =
    nextReviewAt === null
      ? null
      : Math.floor((input.clock.now().getTime() - Date.parse(nextReviewAt)) / minuteMs)
  const accuracy =
    scoredAttempts.length === 0
      ? 0
      : scoredAttempts.reduce((sum, item) => sum + scoreForResult(item.attempt), 0) /
        scoredAttempts.length
  const averageHintCost = scoredAttempts.length === 0 ? 0 : totalHintCost / scoredAttempts.length
  const requirements = {
    independentAnswers: independentCorrect.length,
    exerciseKinds: exerciseKindCount,
    hasDebugging: debugCorrect > 0,
    hasTransfer: transferCorrect > 0,
    hasDelayedReview: successfulDelayedReviews > 0,
    readyForMastery:
      independentCorrect.length >= 2 &&
      exerciseKindCount >= 3 &&
      debugCorrect > 0 &&
      transferCorrect > 0 &&
      successfulDelayedReviews > 0,
  }
  const score = computeMasteryScore({
    scoredAttempts,
    accuracy,
    firstAttemptScore,
    requirements,
    answerSpeedScore,
    recencyDays,
    averageHintCost,
    viewedSolutionCount,
    repeatedMisconceptionTags,
    successStreak,
  })

  return {
    skillId: input.skillId,
    status: deriveUnlockedStatus({
      attempts: scoredAttempts.length,
      score,
      accuracy,
      averageHintCost,
      viewedSolutionCount,
      repeatedMisconceptionTags,
      successStreak,
      dueByMinutes,
      recencyDays,
      requirements,
    }),
    score,
    attempts: scoredAttempts.length,
    accuracy: roundTo(accuracy),
    firstAttemptScore: roundTo(firstAttemptScore),
    independentCorrect: independentCorrect.length,
    hintCount,
    totalHintCost: roundTo(totalHintCost),
    averageHintCost: roundTo(averageHintCost),
    viewedSolutionCount,
    selfReproductionCorrect,
    debugCorrect,
    transferCorrect,
    answerSpeedScore: roundTo(answerSpeedScore),
    recencyDays: recencyDays === null ? null : roundTo(recencyDays),
    successfulDelayedReviews,
    repeatedMisconceptionTags,
    successStreak,
    exerciseKindCount,
    averageDifficulty: roundTo(averageDifficulty),
    lastPracticedAt,
    nextReviewAt,
    dueByMinutes,
    requirements,
  }
}

function computeMasteryScore(input: {
  scoredAttempts: readonly {
    attempt: ExerciseAttempt
    exercise: Exercise
    score: number
    hintCost: number
    speedScore: number
  }[]
  accuracy: number
  firstAttemptScore: number
  requirements: SkillMasteryRequirements
  answerSpeedScore: number
  recencyDays: number | null
  averageHintCost: number
  viewedSolutionCount: number
  repeatedMisconceptionTags: readonly string[]
  successStreak: number
}): number {
  if (input.scoredAttempts.length === 0) {
    return 0
  }

  let weightedScore = 0
  let totalWeight = 0
  for (const [index, item] of input.scoredAttempts.entries()) {
    const recencyWeight = 1 + index * 0.08
    const difficultyWeight = 0.9 + item.exercise.difficulty * 0.04
    const weight = recencyWeight * difficultyWeight
    weightedScore += item.score * weight
    totalWeight += weight
  }

  const requirementsScore =
    Math.min(input.requirements.independentAnswers / 2, 1) * 0.24 +
    Math.min(input.requirements.exerciseKinds / 3, 1) * 0.22 +
    (input.requirements.hasDebugging ? 0.18 : 0) +
    (input.requirements.hasTransfer ? 0.18 : 0) +
    (input.requirements.hasDelayedReview ? 0.18 : 0)
  const recencyMultiplier = decayMultiplier(input.recencyDays)
  const solutionPenalty = Math.min(input.viewedSolutionCount * 0.08, 0.24)
  const misconceptionPenalty = Math.min(input.repeatedMisconceptionTags.length * 0.06, 0.24)
  const hintPenalty = Math.min(input.averageHintCost * 0.28, 0.22)
  const streakBonus = Math.min(input.successStreak * 0.025, 0.1)
  const raw =
    (weightedScore / totalWeight) * 0.5 +
    input.accuracy * 0.16 +
    input.firstAttemptScore * 0.1 +
    requirementsScore * 0.16 +
    input.answerSpeedScore * 0.08 +
    streakBonus -
    solutionPenalty -
    misconceptionPenalty -
    hintPenalty

  return roundTo(clamp(raw * recencyMultiplier, 0, 1))
}

function computeStatusesWithPrerequisites(
  skills: readonly Skill[],
  rawProfiles: ReadonlyMap<string, SkillMasteryProfile>,
  maps: ContentMaps,
): ReadonlyMap<string, SkillStatus> {
  const statuses = new Map<string, SkillStatus>()
  const visiting = new Set<string>()

  function resolve(skillId: string): SkillStatus {
    const existing = statuses.get(skillId)
    if (existing) {
      return existing
    }

    if (visiting.has(skillId)) {
      return rawProfiles.get(skillId)?.status ?? 'locked'
    }

    visiting.add(skillId)
    const prereqIds = maps.prerequisiteSkillIdsBySkill.get(skillId) ?? []
    const hasGap = prereqIds.some((prereqId) => {
      const prereqStatus = resolve(prereqId)
      return prereqStatus !== 'mastered' && prereqStatus !== 'review-due'
    })
    visiting.delete(skillId)

    const status = hasGap ? 'locked' : (rawProfiles.get(skillId)?.status ?? 'locked')
    statuses.set(skillId, status)
    return status
  }

  for (const skill of skills) {
    resolve(skill.id)
  }

  return statuses
}

function deriveUnlockedStatus(input: {
  attempts: number
  score: number
  accuracy: number
  averageHintCost: number
  viewedSolutionCount: number
  repeatedMisconceptionTags: readonly string[]
  successStreak: number
  dueByMinutes: number | null
  recencyDays: number | null
  requirements: SkillMasteryRequirements
}): SkillStatus {
  if (
    input.attempts > 0 &&
    ((input.dueByMinutes !== null && input.dueByMinutes >= 7 * 24 * 60) ||
      (input.recencyDays !== null && input.recencyDays >= 60))
  ) {
    return 'decayed'
  }

  if (input.dueByMinutes !== null && input.dueByMinutes >= 0) {
    return 'review-due'
  }

  if (input.attempts === 0) {
    return 'available'
  }

  const fragile =
    input.attempts >= 3 &&
    (input.score < fragileThreshold ||
      input.accuracy < 0.62 ||
      input.averageHintCost > 0.34 ||
      input.repeatedMisconceptionTags.length > 0 ||
      input.successStreak === 0)

  if (input.requirements.readyForMastery && input.score >= masteryThreshold && !fragile) {
    return 'mastered'
  }

  if (fragile) {
    return 'fragile'
  }

  if (input.attempts === 1) {
    return 'introduced'
  }

  return 'practicing'
}

function scoreExerciseCandidate(input: {
  exercise: Exercise
  input: {
    content: LearningContent
    progress: UserProgress
    clock: Clock
    mode: SessionMode
    currentLessonId?: string
    currentModuleId?: string
    recentExerciseIds?: readonly string[]
  }
  maps: ContentMaps
  profilesBySkill: ReadonlyMap<string, SkillMasteryProfile>
  currentPrerequisiteGaps: ReadonlySet<string>
  recentExercises: readonly Exercise[]
  recentExerciseIds: readonly string[]
}): ExerciseRecommendation | null {
  const primarySkillId = input.exercise.skillIds[0]
  if (!primarySkillId) {
    return null
  }

  if (input.recentExerciseIds.slice(-3).includes(input.exercise.id)) {
    return null
  }

  const lesson = input.maps.lessonsById.get(input.exercise.lessonId)
  const profile = input.profilesBySkill.get(primarySkillId)
  const reasons: string[] = []
  let score = 0

  if (profile?.status === 'review-due') {
    score += 115
    reasons.push('overdue-review')
  }
  if (profile?.status === 'decayed') {
    score += 120
    reasons.push('decayed-skill')
  }
  if (profile?.status === 'fragile') {
    score += 90
    reasons.push('fragile-skill')
  }
  if ((profile?.repeatedMisconceptionTags.length ?? 0) > 0) {
    score += 80
    reasons.push('repeated-misconception')
  }
  if (input.currentPrerequisiteGaps.has(primarySkillId)) {
    score += 95
    reasons.push('prerequisite-gap')
  }
  if (input.input.currentLessonId && input.exercise.lessonId === input.input.currentLessonId) {
    score += 45
    reasons.push('current-lesson')
  }
  if (input.input.currentModuleId && lesson?.moduleId === input.input.currentModuleId) {
    score += 35
    reasons.push('current-module')
  }
  if (!isExerciseCompleted(input.exercise.id, input.input.progress)) {
    score += 25
    reasons.push('new-material')
  }

  score += modeScore(input.exercise, input.input, lesson, profile, reasons)
  score += interleavingScore(input.exercise, input.recentExercises, input.maps, reasons)
  score -= similarityPenalty(input.exercise, input.recentExercises)
  score += input.exercise.difficulty * 0.7

  if (score <= 0) {
    return null
  }

  return {
    exerciseId: input.exercise.id,
    lessonId: input.exercise.lessonId,
    primarySkillId,
    mode: input.input.mode,
    score: roundTo(score),
    reasons,
  }
}

function modeScore(
  exercise: Exercise,
  input: {
    content: LearningContent
    progress: UserProgress
    mode: SessionMode
    currentLessonId?: string
    currentModuleId?: string
  },
  lesson: Lesson | undefined,
  profile: SkillMasteryProfile | undefined,
  reasons: string[],
): number {
  switch (input.mode) {
    case 'guided-lesson':
      return exercise.lessonId === input.currentLessonId
        ? addReason(reasons, 'guided-step', 55)
        : 15
    case 'daily-review':
      return profile?.status === 'review-due' || profile?.status === 'decayed'
        ? addReason(reasons, 'daily-review', 80)
        : -20
    case 'weak-skills-practice':
      return profile && profile.score < 0.62 ? addReason(reasons, 'weak-skill', 85) : -10
    case 'rapid-syntax-drill':
      return isRapidSyntaxExercise(exercise)
        ? addReason(reasons, 'rapid-syntax', exercise.difficulty <= 2 ? 80 : 45)
        : -45
    case 'debugging-practice':
      return exercise.kind === 'code-debugging'
        ? addReason(reasons, 'debugging', 95)
        : exercise.kind === 'code-refactoring'
          ? addReason(reasons, 'debug-adjacent', 42)
          : -35
    case 'transfer-practice':
      return exercise.kind === 'scenario-based-transfer' || exercise.kind === 'project-step'
        ? addReason(reasons, 'transfer', 95)
        : exercise.kind === 'self-check-question'
          ? addReason(reasons, 'reflection-transfer', 25)
          : -30
    case 'module-assessment':
      return lesson?.moduleId === input.currentModuleId
        ? addReason(reasons, 'module-assessment', exercise.difficulty >= 3 ? 70 : 45)
        : -25
    case 'diagnostic-session':
      return input.content.courseDiagnosticExerciseIds.includes(exercise.id)
        ? addReason(reasons, 'diagnostic', 120)
        : -30
  }
}

function addReason(reasons: string[], reason: string, score: number): number {
  reasons.push(reason)
  return score
}

function isExerciseAvailable(input: {
  exercise: Exercise
  maps: ContentMaps
  profilesBySkill: ReadonlyMap<string, SkillMasteryProfile>
  progress: UserProgress
}): boolean {
  const lesson = input.maps.lessonsById.get(input.exercise.lessonId)
  if (!lesson) {
    return false
  }

  const module = input.maps.modulesById.get(lesson.moduleId)
  if (!module) {
    return false
  }

  for (const prerequisiteModuleId of module.prerequisiteModuleIds) {
    const prerequisiteModule = input.maps.modulesById.get(prerequisiteModuleId)
    if (!prerequisiteModule) {
      return false
    }

    const moduleMastered = prerequisiteModule.skillIds.every((skillId) => {
      const status = input.profilesBySkill.get(skillId)?.status
      return status === 'mastered' || status === 'review-due'
    })
    if (!moduleMastered) {
      return false
    }
  }

  return input.exercise.skillIds.every((skillId) => {
    const status = input.profilesBySkill.get(skillId)?.status
    return status !== 'locked'
  })
}

function collectCurrentPrerequisiteGaps(
  input: {
    content: LearningContent
    progress: UserProgress
    clock: Clock
    currentLessonId?: string
    currentModuleId?: string
  },
  maps: ContentMaps,
  profilesBySkill: ReadonlyMap<string, SkillMasteryProfile>,
): ReadonlySet<string> {
  const gaps = new Set<string>()
  const currentLessons = input.currentLessonId
    ? [maps.lessonsById.get(input.currentLessonId)].filter(
        (lesson): lesson is Lesson => lesson !== undefined,
      )
    : input.content.lessons.filter((lesson) => lesson.moduleId === input.currentModuleId)

  for (const lesson of currentLessons) {
    for (const skillId of lesson.skillIds) {
      for (const prerequisiteId of maps.prerequisiteSkillIdsBySkill.get(skillId) ?? []) {
        const status = profilesBySkill.get(prerequisiteId)?.status
        if (status !== 'mastered' && status !== 'review-due') {
          gaps.add(prerequisiteId)
        }
      }
    }
  }

  return gaps
}

function compareRecommendations(
  left: ExerciseRecommendation,
  right: ExerciseRecommendation,
  maps: ContentMaps,
): number {
  const scoreDifference = right.score - left.score
  if (scoreDifference !== 0) {
    return scoreDifference
  }

  const leftExercise = maps.exercisesById.get(left.exerciseId)
  const rightExercise = maps.exercisesById.get(right.exerciseId)
  const leftLesson = leftExercise ? maps.lessonsById.get(leftExercise.lessonId) : undefined
  const rightLesson = rightExercise ? maps.lessonsById.get(rightExercise.lessonId) : undefined
  const lessonOrderDifference = (leftLesson?.order ?? 0) - (rightLesson?.order ?? 0)
  if (lessonOrderDifference !== 0) {
    return lessonOrderDifference
  }

  return left.exerciseId.localeCompare(right.exerciseId)
}

function qualityFromAttempt(attempt: ExerciseAttempt): PracticeQuality {
  if (attempt.result.status === 'incorrect' || attempt.result.status === 'skipped') {
    return 'again'
  }
  if (attempt.result.status === 'partially-correct' || attempt.usedHintIds.length > 1) {
    return 'hard'
  }
  if (
    attempt.usedHintIds.length === 0 &&
    attempt.viewedSolution !== true &&
    attempt.selfReproduced
  ) {
    return 'easy'
  }
  return 'good'
}

function scoreAttempt(attempt: ExerciseAttempt, exercise: Exercise): number {
  const base = scoreForResult(attempt)
  const hintCost = computeHintCost(attempt, exercise)
  const solutionFactor = attempt.viewedSolution === true ? 0.28 : 1
  const speedFactor = computeAnswerSpeedScore(attempt, exercise)
  const difficultyFactor = 0.9 + exercise.difficulty * 0.04
  const reproductionBonus =
    attempt.result.status === 'correct' && attempt.selfReproduced === true ? 0.08 : 0
  const transferOrDebugBonus =
    attempt.result.status === 'correct' &&
    (exercise.kind === 'code-debugging' || exercise.kind === 'scenario-based-transfer')
      ? 0.04
      : 0

  return clamp(
    base * Math.max(0.12, 1 - hintCost) * solutionFactor * speedFactor * difficultyFactor +
      reproductionBonus +
      transferOrDebugBonus,
    0,
    1,
  )
}

function scoreForResult(attempt: ExerciseAttempt): number {
  if (attempt.result.status === 'correct') return 1
  if (attempt.result.status === 'partially-correct') return 0.45
  if (attempt.result.status === 'incorrect') return 0.08
  return 0
}

function computeHintCost(attempt: ExerciseAttempt, exercise: Exercise): number {
  const hintsById = new Map(exercise.hints.map((hint) => [hint.id, hint]))
  const explicitHintCost = attempt.usedHintIds.reduce((sum, hintId) => {
    const hint = hintsById.get(hintId)
    return sum + (hint ? hintCostForLevel(hint.level) : 0.25)
  }, 0)
  const solutionCost = attempt.viewedSolution === true ? hintCostForLevel(4) : 0

  return clamp(explicitHintCost + solutionCost, 0, 0.88)
}

function computeAnswerSpeedScore(attempt: ExerciseAttempt, exercise: Exercise): number {
  if (attempt.durationSeconds === undefined) {
    return 0.75
  }

  if (attempt.durationSeconds <= 0) {
    return 1
  }

  const ratio = attempt.durationSeconds / exercise.estimatedSeconds
  if (ratio <= 0.75) return 1
  if (ratio <= 1) return 0.92
  if (ratio <= 1.5) return 0.78
  if (ratio <= 2.5) return 0.58
  return 0.38
}

function getAttemptsForSkill(
  skillId: string,
  progress: UserProgress,
  exercisesById: ReadonlyMap<string, Exercise>,
): readonly ExerciseAttempt[] {
  return Object.values(progress.exerciseAttempts)
    .filter((attempt) => exercisesById.get(attempt.exerciseId)?.skillIds.includes(skillId) === true)
    .sort(compareAttempts)
}

function compareAttempts(left: ExerciseAttempt, right: ExerciseAttempt): number {
  const timeDifference = Date.parse(left.answeredAt) - Date.parse(right.answeredAt)
  return timeDifference === 0 ? left.id.localeCompare(right.id) : timeDifference
}

function firstAttemptPerExercise(
  attempts: readonly {
    attempt: ExerciseAttempt
    exercise: Exercise
    score: number
    hintCost: number
    speedScore: number
  }[],
): readonly {
  attempt: ExerciseAttempt
  exercise: Exercise
  score: number
  hintCost: number
  speedScore: number
}[] {
  const firstByExercise = new Map<string, (typeof attempts)[number]>()
  for (const item of attempts) {
    if (!firstByExercise.has(item.attempt.exerciseId)) {
      firstByExercise.set(item.attempt.exerciseId, item)
    }
  }

  return Array.from(firstByExercise.values())
}

function collectRepeatedMisconceptionTags(
  attempts: readonly { attempt: ExerciseAttempt }[],
): readonly string[] {
  const counts = new Map<string, number>()
  for (const { attempt } of attempts) {
    for (const tag of attempt.misconceptionTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .sort()
}

function countSuccessStreak(attempts: readonly { attempt: ExerciseAttempt }[]): number {
  let streak = 0
  for (const item of attempts.slice().reverse()) {
    if (item.attempt.result.status !== 'correct') {
      break
    }
    streak += 1
  }

  return streak
}

function countCorrectWithHints(
  skillId: string,
  progress: UserProgress,
  exercisesById: ReadonlyMap<string, Exercise>,
): number {
  return getAttemptsForSkill(skillId, progress, exercisesById).filter(
    (attempt) => attempt.result.status === 'correct' && attempt.usedHintIds.length > 0,
  ).length
}

function getNextReviewAt(skillId: string, progress: UserProgress): string | null {
  const skillProgressReview = progress.skillProgress[skillId]?.nextReviewAt ?? null
  const queueReview = progress.reviewQueue
    .filter((item) => item.skillId === skillId && item.state !== 'suspended')
    .map((item) => item.schedule.dueAt)
    .sort()[0]

  return queueReview ?? skillProgressReview
}

function upsertReviewItem(items: readonly ReviewItem[], next: ReviewItem): ReviewItem[] {
  const withoutExisting = items.filter((item) => item.id !== next.id)
  return [...withoutExisting, next].sort((left, right) => left.id.localeCompare(right.id))
}

function inferPreviousIntervalIndex(
  previous: Partial<SpacedRepetitionState> | ReviewSchedule | undefined,
): number {
  if (!previous) {
    return -1
  }

  if ('intervalIndex' in previous && typeof previous.intervalIndex === 'number') {
    return Math.max(-1, Math.floor(previous.intervalIndex))
  }

  const minutes = inferPreviousIntervalMinutes(previous, -1)
  const index = baseReviewIntervalsMinutes.findIndex((interval) => interval >= minutes)
  return index === -1 ? baseReviewIntervalsMinutes.length - 1 : index
}

function inferPreviousIntervalMinutes(
  previous: Partial<SpacedRepetitionState> | ReviewSchedule | undefined,
  fallbackIndex: number,
): number {
  if (!previous) {
    return reviewIntervalAt(0)
  }

  if ('intervalMinutes' in previous && typeof previous.intervalMinutes === 'number') {
    return Math.max(10, previous.intervalMinutes)
  }

  if (typeof previous.intervalDays === 'number') {
    return Math.max(10, previous.intervalDays * 1_440)
  }

  return reviewIntervalAt(fallbackIndex)
}

function previousReviewScheduleFromProgress(
  progress: UserProgress['skillProgress'][string],
  fallbackDueAt: string,
): ReviewSchedule {
  const schedule: ReviewSchedule = {
    intervalDays: progress.intervalDays,
    intervalMinutes: Math.max(10, progress.intervalDays * 1_440),
    ease: progress.ease,
    dueAt: progress.nextReviewAt ?? fallbackDueAt,
  }

  if (progress.lastPracticedAt) {
    return {
      ...schedule,
      lastReviewedAt: progress.lastPracticedAt,
    }
  }

  return schedule
}

function reviewIntervalAt(index: number): number {
  const boundedIndex = clampInteger(index, 0, baseReviewIntervalsMinutes.length - 1)
  return baseReviewIntervalsMinutes[boundedIndex] ?? baseReviewIntervalsMinutes[0]
}

function nextIntervalIndex(previousIndex: number, quality: PracticeQuality): number {
  const lastIndex = baseReviewIntervalsMinutes.length - 1
  if (quality === 'again') {
    return Math.max(0, previousIndex - 2)
  }
  if (quality === 'hard') {
    return Math.max(0, previousIndex)
  }
  if (quality === 'good') {
    return clampInteger(previousIndex + 1, 0, lastIndex)
  }
  return clampInteger(previousIndex + 2, 0, lastIndex)
}

function decayMultiplier(recencyDays: number | null): number {
  if (recencyDays === null) return 1
  if (recencyDays >= 90) return 0.42
  if (recencyDays >= 60) return 0.55
  if (recencyDays >= 21) return 0.72
  if (recencyDays >= 7) return 0.88
  if (recencyDays >= 3) return 0.95
  return 1
}

function isExerciseCompleted(exerciseId: string, progress: UserProgress): boolean {
  return Object.values(progress.lessonProgress).some((lessonProgress) =>
    lessonProgress.completedExerciseIds.includes(exerciseId),
  )
}

function isRapidSyntaxExercise(exercise: Exercise): boolean {
  return (
    exercise.difficulty <= 2 &&
    (exercise.kind === 'single-choice' ||
      exercise.kind === 'multiple-choice' ||
      exercise.kind === 'true-false' ||
      exercise.kind === 'token-ordering' ||
      exercise.kind === 'fill-in-the-blanks' ||
      exercise.kind === 'output-prediction' ||
      exercise.kind === 'type-prediction')
  )
}

function similarityPenalty(exercise: Exercise, recentExercises: readonly Exercise[]): number {
  const lastTwo = recentExercises.slice(-2)
  const sameKindCount = lastTwo.filter((recent) => recent.kind === exercise.kind).length
  const samePrimarySkillCount = lastTwo.filter(
    (recent) => recent.skillIds[0] === exercise.skillIds[0],
  ).length

  return sameKindCount * 22 + samePrimarySkillCount * 18
}

function interleavingScore(
  exercise: Exercise,
  recentExercises: readonly Exercise[],
  maps: ContentMaps,
  reasons: string[],
): number {
  const recentTags = new Set(
    recentExercises.flatMap((recent) => classifyInterleavingTags(recent, maps)),
  )
  if (recentTags.size === 0) {
    return 0
  }

  const candidateTags = classifyInterleavingTags(exercise, maps)
  for (const group of interleavingGroups) {
    const recentGroupTags = group.filter((tag) => recentTags.has(tag))
    const candidateGroupTags = group.filter((tag) => candidateTags.includes(tag))
    if (recentGroupTags.length === 0 || candidateGroupTags.length === 0) {
      continue
    }

    if (candidateGroupTags.some((tag) => !recentTags.has(tag))) {
      reasons.push('interleaving')
      return 44
    }

    return -16
  }

  return 0
}

const interleavingGroups = [
  ['map', 'flatmap'],
  ['equality', 'identity'],
  ['safe-call', 'elvis'],
  ['launch', 'async'],
  ['cold-flow', 'stateflow'],
] as const

function classifyInterleavingTags(exercise: Exercise, maps: ContentMaps): readonly string[] {
  const skillText = exercise.skillIds
    .map((skillId) => {
      const skill = maps.skillsById.get(skillId)
      return skill ? `${skill.id} ${skill.title} ${skill.summary}` : skillId
    })
    .join(' ')
  const text = `${exercise.id} ${exercise.title} ${exercise.prompt} ${skillText}`.toLowerCase()
  const tags: string[] = []

  if (/\bflatmap\b|flat-map|flat_map/.test(text)) tags.push('flatmap')
  if (/\bmap\b/.test(text) && !tags.includes('flatmap')) tags.push('map')
  if (text.includes('===') || text.includes('identity')) tags.push('identity')
  if ((text.includes('==') && !text.includes('===')) || text.includes('equality')) {
    tags.push('equality')
  }
  if (text.includes('?.') || text.includes('safe call') || text.includes('safe-call')) {
    tags.push('safe-call')
  }
  if (text.includes('?:') || text.includes('elvis')) tags.push('elvis')
  if (/\blaunch\b/.test(text)) tags.push('launch')
  if (/\basync\b/.test(text)) tags.push('async')
  if (text.includes('cold flow') || text.includes('cold-flow')) tags.push('cold-flow')
  if (text.includes('stateflow') || text.includes('state flow')) tags.push('stateflow')

  return tags
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max))
}

function roundTo(value: number, fractionDigits = 3): number {
  return Number(value.toFixed(fractionDigits))
}
