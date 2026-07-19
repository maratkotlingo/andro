import { describe, expect, it } from 'vitest'
import type {
  Exercise,
  ExerciseAttempt,
  Lesson,
  Module,
  ReviewItem,
  Skill,
  UserProgress,
} from '../model'
import { exerciseSchema } from '../model'
import {
  computeSkillMastery,
  computeSkillMasteryProfiles,
  fixedClock,
  hintCostForLevel,
  learningContentFromPackage,
  scheduleNextReview,
  selectNextExercise,
  selectNextExercises,
  updateProgressAfterAttempt,
  type LearningContent,
  type PracticeQuality,
} from './engine'

const baseIso = '2026-07-19T00:00:00.000Z'
const clock = fixedClock(baseIso)

function emptyProgress(): UserProgress {
  return {
    schemaVersion: 1,
    contentVersion: 'test',
    userId: 'local',
    lessonProgress: {},
    skillProgress: {},
    exerciseAttempts: {},
    reviewQueue: [],
  }
}

function skill(id: string, title: string, dependencies: Skill['dependencies'] = []): Skill {
  return {
    id,
    title,
    summary: `${title} summary`,
    area: 'test',
    dependencies,
  }
}

function moduleFixture(
  id: string,
  lessonIds: readonly string[],
  skillIds: readonly string[],
  prerequisiteModuleIds: readonly string[] = [],
): Module {
  return {
    id,
    slug: id.replaceAll('.', '-'),
    title: id,
    summary: id,
    order: id.endsWith('advanced') ? 1 : 0,
    lessonIds: [...lessonIds],
    skillIds: [...skillIds],
    prerequisiteModuleIds: [...prerequisiteModuleIds],
  }
}

function lessonFixture(
  id: string,
  moduleId: string,
  exerciseIds: readonly string[],
  skillIds: readonly string[],
): Lesson {
  return {
    id,
    moduleId,
    title: id,
    summary: id,
    order: id.endsWith('advanced') ? 1 : 0,
    conceptIds: [],
    exampleIds: [],
    exerciseIds: [...exerciseIds],
    skillIds: [...skillIds],
    estimatedMinutes: 10,
  }
}

function parseExercise(value: unknown): Exercise {
  return exerciseSchema.parse(value)
}

function exerciseBase(id: string, lessonId: string, skillId: string, difficulty = 2) {
  return {
    id,
    lessonId,
    skillIds: [skillId],
    title: id,
    prompt: id,
    difficulty,
    estimatedSeconds: 60,
    hints: [
      { id: `${id}.hint.1`, level: 1, body: 'Концептуальное направление.' },
      { id: `${id}.hint.2`, level: 2, body: 'Указание на часть конструкции.' },
      { id: `${id}.hint.3`, level: 3, body: 'Частичное решение.' },
      { id: `${id}.hint.4`, level: 4, body: 'Полный разбор.' },
    ],
    explanationId: 'explanation.test',
  }
}

function singleChoiceExercise(
  id: string,
  lessonId: string,
  skillId: string,
  difficulty = 2,
): Exercise {
  return parseExercise({
    ...exerciseBase(id, lessonId, skillId, difficulty),
    kind: 'single-choice',
    options: [
      { id: `${id}.option.a`, label: 'A' },
      { id: `${id}.option.b`, label: 'B' },
    ],
    checker: { kind: 'single-choice', correctOptionId: `${id}.option.a` },
  })
}

function tokenExercise(id: string, lessonId: string, skillId: string): Exercise {
  return parseExercise({
    ...exerciseBase(id, lessonId, skillId, 1),
    kind: 'token-ordering',
    tokens: ['val', 'name', '=', '"Kotlin"'],
    checker: {
      kind: 'token-ordering',
      expectedTokens: ['val', 'name', '=', '"Kotlin"'],
      allowExtraWhitespace: true,
    },
  })
}

function writingExercise(id: string, lessonId: string, skillId: string): Exercise {
  return parseExercise({
    ...exerciseBase(id, lessonId, skillId, 3),
    kind: 'code-writing',
    starterCode: 'fun answer(): String = TODO()',
    checker: {
      kind: 'code-writing',
      requiredConstructs: ['val'],
      forbiddenConstructs: ['!!'],
    },
  })
}

function debuggingExercise(id: string, lessonId: string, skillId: string): Exercise {
  return parseExercise({
    ...exerciseBase(id, lessonId, skillId, 3),
    kind: 'code-debugging',
    brokenCode: 'val name = user.name!!',
    checker: {
      kind: 'code-debugging',
      requiredFixes: ['remove-not-null-assertion'],
      forbiddenPatterns: ['!!'],
    },
  })
}

function transferExercise(id: string, lessonId: string, skillId: string): Exercise {
  return parseExercise({
    ...exerciseBase(id, lessonId, skillId, 4),
    kind: 'scenario-based-transfer',
    scenario: 'Apply the concept in a UI profile scenario.',
    checker: {
      kind: 'scenario-based-transfer',
      requiredConceptIds: ['concept.test'],
      acceptedSolutionIds: ['solution.test'],
    },
  })
}

function contentFixture(
  options: {
    skills?: readonly Skill[]
    modules?: readonly Module[]
    lessons?: readonly Lesson[]
    exercises?: readonly Exercise[]
    diagnostics?: readonly string[]
  } = {},
): LearningContent {
  const defaultSkill = skill('skill.core', 'Core')
  const defaultExercises = [
    singleChoiceExercise('exercise.core.choice', 'lesson.core', defaultSkill.id),
  ]
  const exercises = options.exercises ?? defaultExercises
  const skills = options.skills ?? [defaultSkill]
  const lessons = options.lessons ?? [
    lessonFixture(
      'lesson.core',
      'module.core',
      exercises.map((exercise) => exercise.id),
      skills.map((item) => item.id),
    ),
  ]
  const modules = options.modules ?? [
    moduleFixture(
      'module.core',
      lessons.map((lesson) => lesson.id),
      skills.map((item) => item.id),
    ),
  ]

  return {
    courseDiagnosticExerciseIds: options.diagnostics ?? [],
    modules,
    skills,
    lessons,
    exercises,
  }
}

function answeredAt(minutesOffset: number): string {
  return new Date(Date.parse(baseIso) + minutesOffset * 60_000).toISOString()
}

function attempt(input: {
  exercise: Exercise
  index: number
  status?: ExerciseAttempt['result']['status']
  minutesOffset?: number
  usedHintIds?: readonly string[]
  viewedSolution?: boolean
  selfReproduced?: boolean
  isReview?: boolean
  quality?: PracticeQuality
  misconceptionTags?: readonly string[]
  durationSeconds?: number
}): ExerciseAttempt {
  const status = input.status ?? 'correct'
  return {
    id: `attempt.${input.exercise.id}.${input.index}`,
    exerciseId: input.exercise.id,
    lessonId: input.exercise.lessonId,
    answeredAt: answeredAt(input.minutesOffset ?? input.index),
    usedHintIds: [...(input.usedHintIds ?? [])],
    answer: 'answer',
    result: {
      status,
      score: status === 'correct' ? 1 : status === 'partially-correct' ? 0.5 : 0,
      checkerKind: input.exercise.kind,
      matchedRules: status === 'correct' ? ['ok'] : [],
      failedRules: status === 'correct' ? [] : ['missing'],
      feedback: 'deterministic fixture',
    },
    ...(input.viewedSolution === undefined ? {} : { viewedSolution: input.viewedSolution }),
    ...(input.selfReproduced === undefined ? {} : { selfReproduced: input.selfReproduced }),
    ...(input.isReview === undefined ? {} : { isReview: input.isReview }),
    ...(input.quality === undefined ? {} : { quality: input.quality }),
    ...(input.misconceptionTags === undefined
      ? {}
      : { misconceptionTags: [...input.misconceptionTags] }),
    ...(input.durationSeconds === undefined ? {} : { durationSeconds: input.durationSeconds }),
  }
}

function progressWithAttempts(attempts: readonly ExerciseAttempt[]): UserProgress {
  return {
    ...emptyProgress(),
    exerciseAttempts: Object.fromEntries(attempts.map((item) => [item.id, item])),
  }
}

function exerciseAt(exercises: readonly Exercise[], index: number): Exercise {
  const exercise = exercises[index]
  if (!exercise) {
    throw new Error(`Missing fixture exercise at index ${index}`)
  }

  return exercise
}

function masteryReadyProgress(content: LearningContent, skillId = 'skill.core'): UserProgress {
  const exercises = content.exercises.filter((exercise) => exercise.skillIds.includes(skillId))
  const attempts = [
    attempt({
      exercise: exerciseAt(exercises, 0),
      index: 1,
      selfReproduced: true,
      durationSeconds: 35,
    }),
    attempt({
      exercise: exerciseAt(exercises, 1),
      index: 2,
      selfReproduced: true,
      durationSeconds: 40,
    }),
    attempt({
      exercise: exerciseAt(exercises, 2),
      index: 3,
      selfReproduced: true,
      durationSeconds: 45,
    }),
    attempt({
      exercise: exerciseAt(exercises, 3),
      index: 4,
      selfReproduced: true,
      durationSeconds: 50,
    }),
    attempt({
      exercise: exerciseAt(exercises, 4),
      index: 5,
      selfReproduced: true,
      isReview: true,
      quality: 'easy',
      durationSeconds: 30,
    }),
  ]

  return progressWithAttempts(attempts)
}

describe('learning engine scheduling', () => {
  it('uses deterministic base intervals and adapts after sixty days', () => {
    const firstAgain = scheduleNextReview({ quality: 'again', clock })
    const firstGood = scheduleNextReview({ quality: 'good', clock })
    const afterSixtyDays = scheduleNextReview({
      quality: 'easy',
      clock,
      previous: {
        intervalIndex: 5,
        intervalMinutes: 86_400,
        intervalDays: 60,
        ease: 2.3,
        dueAt: baseIso,
        lastReviewedAt: baseIso,
        successfulReviews: 5,
        lapses: 0,
      },
    })
    const afterError = scheduleNextReview({
      quality: 'again',
      clock,
      previous: {
        intervalIndex: 5,
        intervalMinutes: 86_400,
        intervalDays: 60,
        ease: 2.3,
        dueAt: baseIso,
        lastReviewedAt: baseIso,
        successfulReviews: 5,
        lapses: 0,
      },
    })

    expect(firstAgain.intervalMinutes).toBe(10)
    expect(firstGood.intervalMinutes).toBe(10)
    expect(afterSixtyDays.intervalMinutes).toBeGreaterThan(86_400)
    expect(afterSixtyDays.ease).toBeGreaterThan(2.3)
    expect(afterError.intervalMinutes).toBe(10_080)
    expect(afterError.successfulReviews).toBe(5)
    expect(afterError.lapses).toBe(1)
  })

  it('handles due dates across year boundaries with an injected clock', () => {
    const yearEndClock = fixedClock('2026-12-31T23:55:00.000Z')
    const next = scheduleNextReview({ quality: 'good', clock: yearEndClock })

    expect(next.dueAt).toBe('2027-01-01T00:05:00.000Z')
  })
})

describe('learning engine mastery', () => {
  it('computes locked, available, introduced and practicing statuses from prerequisites and attempts', () => {
    const core = skill('skill.core', 'Core')
    const advanced = skill('skill.advanced', 'Advanced', [
      {
        fromSkillId: 'skill.advanced',
        toSkillId: 'skill.core',
        kind: 'prerequisite',
      },
    ])
    const coreExercise = singleChoiceExercise('exercise.core.choice', 'lesson.core', core.id)
    const advancedExercise = singleChoiceExercise(
      'exercise.advanced.choice',
      'lesson.advanced',
      advanced.id,
    )
    const content = contentFixture({
      skills: [core, advanced],
      exercises: [coreExercise, advancedExercise],
      lessons: [
        lessonFixture('lesson.core', 'module.core', [coreExercise.id], [core.id]),
        lessonFixture('lesson.advanced', 'module.advanced', [advancedExercise.id], [advanced.id]),
      ],
      modules: [
        moduleFixture('module.core', ['lesson.core'], [core.id]),
        moduleFixture('module.advanced', ['lesson.advanced'], [advanced.id], ['module.core']),
      ],
    })
    const initialProfiles = computeSkillMasteryProfiles({
      content,
      progress: emptyProgress(),
      clock,
    })
    const introduced = computeSkillMastery({
      skillId: core.id,
      content,
      progress: progressWithAttempts([attempt({ exercise: coreExercise, index: 1 })]),
      clock,
    })
    const practicing = computeSkillMastery({
      skillId: core.id,
      content,
      progress: progressWithAttempts([
        attempt({ exercise: coreExercise, index: 1 }),
        attempt({ exercise: coreExercise, index: 2 }),
      ]),
      clock,
    })

    expect(initialProfiles.find((profile) => profile.skillId === core.id)?.status).toBe('available')
    expect(initialProfiles.find((profile) => profile.skillId === advanced.id)?.status).toBe(
      'locked',
    )
    expect(introduced.status).toBe('introduced')
    expect(practicing.status).toBe('practicing')
  })

  it('requires independent answers, three exercise kinds, debugging, transfer and delayed review for mastery', () => {
    const content = contentFixture({
      exercises: [
        singleChoiceExercise('exercise.core.choice', 'lesson.core', 'skill.core'),
        writingExercise('exercise.core.write', 'lesson.core', 'skill.core'),
        tokenExercise('exercise.core.token', 'lesson.core', 'skill.core'),
        debuggingExercise('exercise.core.debug', 'lesson.core', 'skill.core'),
        transferExercise('exercise.core.transfer', 'lesson.core', 'skill.core'),
      ],
    })
    const withoutDebugAndTransfer = progressWithAttempts([
      attempt({
        exercise: exerciseAt(content.exercises, 0),
        index: 1,
        selfReproduced: true,
        durationSeconds: 35,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 1),
        index: 2,
        selfReproduced: true,
        durationSeconds: 35,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 2),
        index: 3,
        selfReproduced: true,
        isReview: true,
        durationSeconds: 35,
      }),
    ])
    const ready = masteryReadyProgress(content)

    const incompleteProfile = computeSkillMastery({
      skillId: 'skill.core',
      content,
      progress: withoutDebugAndTransfer,
      clock,
    })
    const masteredProfile = computeSkillMastery({
      skillId: 'skill.core',
      content,
      progress: ready,
      clock,
    })

    expect(incompleteProfile.requirements.readyForMastery).toBe(false)
    expect(incompleteProfile.status).not.toBe('mastered')
    expect(masteredProfile.requirements).toMatchObject({
      independentAnswers: 5,
      exerciseKinds: 5,
      hasDebugging: true,
      hasTransfer: true,
      hasDelayedReview: true,
      readyForMastery: true,
    })
    expect(masteredProfile.status).toBe('mastered')
  })

  it('marks mastered knowledge as review-due exactly at due time and decayed when very overdue', () => {
    const content = contentFixture({
      exercises: [
        singleChoiceExercise('exercise.core.choice', 'lesson.core', 'skill.core'),
        writingExercise('exercise.core.write', 'lesson.core', 'skill.core'),
        tokenExercise('exercise.core.token', 'lesson.core', 'skill.core'),
        debuggingExercise('exercise.core.debug', 'lesson.core', 'skill.core'),
        transferExercise('exercise.core.transfer', 'lesson.core', 'skill.core'),
      ],
    })
    const dueProgress = {
      ...masteryReadyProgress(content),
      reviewQueue: [reviewItem('review.skill.core', 'skill.core', 'exercise.core.choice', baseIso)],
    }
    const decayedProgress = {
      ...masteryReadyProgress(content),
      reviewQueue: [
        reviewItem(
          'review.skill.core',
          'skill.core',
          'exercise.core.choice',
          '2026-07-01T00:00:00.000Z',
        ),
      ],
    }

    expect(
      computeSkillMastery({ skillId: 'skill.core', content, progress: dueProgress, clock }).status,
    ).toBe('review-due')
    expect(
      computeSkillMastery({ skillId: 'skill.core', content, progress: decayedProgress, clock })
        .status,
    ).toBe('decayed')
  })

  it('penalizes hints, full solution views and repeated misconception tags', () => {
    const content = contentFixture({
      exercises: [
        singleChoiceExercise('exercise.core.choice', 'lesson.core', 'skill.core'),
        debuggingExercise('exercise.core.debug', 'lesson.core', 'skill.core'),
        transferExercise('exercise.core.transfer', 'lesson.core', 'skill.core'),
      ],
    })
    const clean = progressWithAttempts([
      attempt({
        exercise: exerciseAt(content.exercises, 0),
        index: 1,
        selfReproduced: true,
        durationSeconds: 30,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 1),
        index: 2,
        selfReproduced: true,
        durationSeconds: 30,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 2),
        index: 3,
        selfReproduced: true,
        isReview: true,
        durationSeconds: 30,
      }),
    ])
    const assisted = progressWithAttempts([
      attempt({
        exercise: exerciseAt(content.exercises, 0),
        index: 1,
        usedHintIds: ['exercise.core.choice.hint.4'],
        viewedSolution: true,
        misconceptionTags: ['misconception.same'],
        durationSeconds: 180,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 1),
        index: 2,
        usedHintIds: ['exercise.core.debug.hint.3'],
        viewedSolution: true,
        misconceptionTags: ['misconception.same'],
        durationSeconds: 180,
      }),
      attempt({
        exercise: exerciseAt(content.exercises, 2),
        index: 3,
        usedHintIds: ['exercise.core.transfer.hint.2'],
        misconceptionTags: ['misconception.same'],
        durationSeconds: 180,
      }),
    ])
    const cleanProfile = computeSkillMastery({
      skillId: 'skill.core',
      content,
      progress: clean,
      clock,
    })
    const assistedProfile = computeSkillMastery({
      skillId: 'skill.core',
      content,
      progress: assisted,
      clock,
    })

    expect(hintCostForLevel(4)).toBeGreaterThan(hintCostForLevel(1) * 4)
    expect(assistedProfile.score).toBeLessThan(cleanProfile.score)
    expect(assistedProfile.status).toBe('fragile')
    expect(assistedProfile.repeatedMisconceptionTags).toEqual(['misconception.same'])
    expect(assistedProfile.viewedSolutionCount).toBe(2)
  })
})

describe('learning engine exercise selection', () => {
  it('prioritizes overdue reviews and fragile skills', () => {
    const reviewSkill = skill('skill.review', 'Review')
    const fragileSkill = skill('skill.fragile', 'Fragile')
    const reviewExercise = singleChoiceExercise(
      'exercise.review.choice',
      'lesson.review',
      reviewSkill.id,
    )
    const fragileExercise = singleChoiceExercise(
      'exercise.fragile.choice',
      'lesson.fragile',
      fragileSkill.id,
    )
    const content = contentFixture({
      skills: [reviewSkill, fragileSkill],
      exercises: [reviewExercise, fragileExercise],
      lessons: [
        lessonFixture('lesson.review', 'module.core', [reviewExercise.id], [reviewSkill.id]),
        lessonFixture('lesson.fragile', 'module.core', [fragileExercise.id], [fragileSkill.id]),
      ],
      modules: [
        moduleFixture(
          'module.core',
          ['lesson.review', 'lesson.fragile'],
          [reviewSkill.id, fragileSkill.id],
        ),
      ],
    })
    const progress = progressWithAttempts([
      attempt({
        exercise: fragileExercise,
        index: 1,
        status: 'incorrect',
        misconceptionTags: ['misconception.repeat'],
      }),
      attempt({
        exercise: fragileExercise,
        index: 2,
        status: 'incorrect',
        misconceptionTags: ['misconception.repeat'],
      }),
      attempt({ exercise: fragileExercise, index: 3, status: 'correct' }),
    ])
    progress.reviewQueue = [
      reviewItem('review.skill.review', reviewSkill.id, reviewExercise.id, baseIso),
    ]

    expect(selectNextExercise({ content, progress, clock, mode: 'daily-review' })?.exerciseId).toBe(
      reviewExercise.id,
    )
    expect(
      selectNextExercise({ content, progress, clock, mode: 'weak-skills-practice' })?.exerciseId,
    ).toBe(fragileExercise.id)
  })

  it('does not select locked advanced topics and repairs prerequisite gaps first', () => {
    const core = skill('skill.core', 'Core')
    const advanced = skill('skill.advanced', 'Advanced', [
      {
        fromSkillId: 'skill.advanced',
        toSkillId: core.id,
        kind: 'prerequisite',
      },
    ])
    const coreExercise = singleChoiceExercise('exercise.core.choice', 'lesson.core', core.id)
    const advancedExercise = singleChoiceExercise(
      'exercise.advanced.choice',
      'lesson.advanced',
      advanced.id,
    )
    const content = contentFixture({
      skills: [core, advanced],
      exercises: [coreExercise, advancedExercise],
      lessons: [
        lessonFixture('lesson.core', 'module.core', [coreExercise.id], [core.id]),
        lessonFixture('lesson.advanced', 'module.advanced', [advancedExercise.id], [advanced.id]),
      ],
      modules: [
        moduleFixture('module.core', ['lesson.core'], [core.id]),
        moduleFixture('module.advanced', ['lesson.advanced'], [advanced.id], ['module.core']),
      ],
    })
    const recommendation = selectNextExercise({
      content,
      progress: emptyProgress(),
      clock,
      mode: 'guided-lesson',
      currentLessonId: 'lesson.advanced',
      currentModuleId: 'module.advanced',
    })

    expect(recommendation?.exerciseId).toBe(coreExercise.id)
    expect(recommendation?.reasons).toContain('prerequisite-gap')
    expect(recommendation?.exerciseId).not.toBe(advancedExercise.id)
  })

  it('interleaves close topics and avoids repeating near-identical exercises', () => {
    const mapSkill = skill('skill.map', 'map')
    const flatMapSkill = skill('skill.flatmap', 'flatMap')
    const mapOne = singleChoiceExercise('exercise.map.one', 'lesson.collections', mapSkill.id)
    const mapTwo = singleChoiceExercise('exercise.map.two', 'lesson.collections', mapSkill.id)
    const flatMap = singleChoiceExercise(
      'exercise.flatmap.one',
      'lesson.collections',
      flatMapSkill.id,
    )
    const content = contentFixture({
      skills: [mapSkill, flatMapSkill],
      exercises: [mapOne, mapTwo, flatMap],
      lessons: [
        lessonFixture(
          'lesson.collections',
          'module.collections',
          [mapOne.id, mapTwo.id, flatMap.id],
          [mapSkill.id, flatMapSkill.id],
        ),
      ],
      modules: [
        moduleFixture('module.collections', ['lesson.collections'], [mapSkill.id, flatMapSkill.id]),
      ],
    })

    const recommendation = selectNextExercise({
      content,
      progress: emptyProgress(),
      clock,
      mode: 'rapid-syntax-drill',
      currentLessonId: 'lesson.collections',
      recentExerciseIds: [mapOne.id],
    })

    expect(recommendation?.exerciseId).toBe(flatMap.id)
    expect(recommendation?.reasons).toContain('interleaving')
  })

  it('honors deterministic strategies for guided, syntax, debugging, transfer, assessment and diagnostic modes', () => {
    const core = skill('skill.core', 'Core')
    const syntax = singleChoiceExercise('exercise.syntax.choice', 'lesson.core', core.id, 1)
    const debug = debuggingExercise('exercise.debug.fix', 'lesson.core', core.id)
    const transfer = transferExercise('exercise.transfer.case', 'lesson.core', core.id)
    const content = contentFixture({
      skills: [core],
      exercises: [syntax, debug, transfer],
      diagnostics: [syntax.id],
    })
    const progress = emptyProgress()

    expect(
      selectNextExercise({
        content,
        progress,
        clock,
        mode: 'guided-lesson',
        currentLessonId: 'lesson.core',
      })?.reasons,
    ).toContain('guided-step')
    expect(
      selectNextExercise({ content, progress, clock, mode: 'rapid-syntax-drill' })?.exerciseId,
    ).toBe(syntax.id)
    expect(
      selectNextExercise({ content, progress, clock, mode: 'debugging-practice' })?.exerciseId,
    ).toBe(debug.id)
    expect(
      selectNextExercise({ content, progress, clock, mode: 'transfer-practice' })?.exerciseId,
    ).toBe(transfer.id)
    expect(
      selectNextExercise({
        content,
        progress,
        clock,
        mode: 'module-assessment',
        currentModuleId: 'module.core',
      })?.reasons,
    ).toContain('module-assessment')
    expect(
      selectNextExercise({ content, progress, clock, mode: 'diagnostic-session' })?.exerciseId,
    ).toBe(syntax.id)
  })

  it('is deterministic for identical inputs', () => {
    const content = contentFixture({
      exercises: [
        singleChoiceExercise('exercise.core.a', 'lesson.core', 'skill.core'),
        tokenExercise('exercise.core.b', 'lesson.core', 'skill.core'),
        debuggingExercise('exercise.core.c', 'lesson.core', 'skill.core'),
      ],
    })
    const input = {
      content,
      progress: emptyProgress(),
      clock,
      mode: 'guided-lesson' as const,
      currentLessonId: 'lesson.core',
      limit: 3,
    }

    expect(selectNextExercises(input)).toEqual(selectNextExercises(input))
  })
})

describe('learning engine progress updates', () => {
  it('updates progress and schedules review without coupling to Vue stores', () => {
    const content = contentFixture({
      exercises: [
        singleChoiceExercise('exercise.core.choice', 'lesson.core', 'skill.core'),
        debuggingExercise('exercise.core.debug', 'lesson.core', 'skill.core'),
      ],
    })
    const firstAttempt = attempt({
      exercise: exerciseAt(content.exercises, 0),
      index: 1,
      selfReproduced: true,
      quality: 'good',
    })
    const nextProgress = updateProgressAfterAttempt({
      content,
      progress: emptyProgress(),
      attempt: firstAttempt,
      clock,
    })

    expect(nextProgress.exerciseAttempts[firstAttempt.id]).toEqual(firstAttempt)
    expect(nextProgress.lessonProgress[firstAttempt.lessonId]?.completedExerciseIds).toEqual([
      firstAttempt.exerciseId,
    ])
    expect(nextProgress.skillProgress['skill.core']?.score).toBeGreaterThan(0)
    expect(nextProgress.reviewQueue[0]?.schedule.intervalMinutes).toBe(10)
  })

  it('can read real package content through a pure adapter', async () => {
    const contentPackage = await import('../../content/sections/foundations')
    const content = learningContentFromPackage(contentPackage.default)

    expect(content.exercises).toHaveLength(17)
    expect(
      selectNextExercise({ content, progress: emptyProgress(), clock, mode: 'guided-lesson' }),
    ).not.toBeNull()
  })
})

function reviewItem(id: string, skillId: string, exerciseId: string, dueAt: string): ReviewItem {
  return {
    id,
    skillId,
    exerciseId,
    lessonId: 'lesson.core',
    schedule: {
      intervalDays: 0,
      intervalMinutes: 10,
      ease: 2.3,
      dueAt,
    },
    state: 'queued',
  }
}
