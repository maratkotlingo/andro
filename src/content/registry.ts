import {
  contentManifestSchema,
  contentPackageSchema,
  type Concept,
  type ContentManifest,
  type ContentPackage,
  type Course,
  type Example,
  type Exercise,
  type Explanation,
  type Lesson,
  type Misconception,
  type Module,
  type Skill,
} from '../domain/model'
import { contentManifest } from './manifest'

export type ContentSectionId = 'foundations'

export type ContentRegistry = {
  manifest: ContentManifest
  course: Course
  modules: ReadonlyMap<string, Module>
  skills: ReadonlyMap<string, Skill>
  lessons: ReadonlyMap<string, Lesson>
  concepts: ReadonlyMap<string, Concept>
  examples: ReadonlyMap<string, Example>
  exercises: ReadonlyMap<string, Exercise>
  explanations: ReadonlyMap<string, Explanation>
  misconceptions: ReadonlyMap<string, Misconception>
  skillDependencies: ReadonlyMap<string, readonly string[]>
  countsBySection: ReadonlyMap<string, ContentCounts>
}

export type ContentCounts = {
  modules: number
  skills: number
  lessons: number
  exercises: number
  concepts: number
  examples: number
}

export type ContentValidationIssue = {
  code:
    | 'schema'
    | 'duplicate-id'
    | 'missing-reference'
    | 'cycle'
    | 'unreachable-lesson'
    | 'manifest-mismatch'
  message: string
}

type SectionModule = {
  default: ContentPackage
}

const contentSectionIds = ['foundations'] as const

const sectionLoaders: Record<ContentSectionId, () => Promise<SectionModule>> = {
  foundations: () => import('./sections/foundations'),
}

function isContentSectionId(sectionId: string): sectionId is ContentSectionId {
  return contentSectionIds.includes(sectionId as ContentSectionId)
}

function addUnique<T extends { id: string }>(
  map: Map<string, T>,
  item: T,
  kind: string,
  issues: ContentValidationIssue[],
): void {
  if (map.has(item.id)) {
    issues.push({
      code: 'duplicate-id',
      message: `Duplicate ${kind} id: ${item.id}`,
    })
    return
  }

  map.set(item.id, item)
}

function requireReference(
  map: ReadonlyMap<string, unknown>,
  id: string,
  owner: string,
  targetKind: string,
  issues: ContentValidationIssue[],
): void {
  if (!map.has(id)) {
    issues.push({
      code: 'missing-reference',
      message: `${owner} references missing ${targetKind}: ${id}`,
    })
  }
}

function requireId(
  ids: ReadonlySet<string>,
  id: string,
  owner: string,
  targetKind: string,
  issues: ContentValidationIssue[],
): void {
  if (!ids.has(id)) {
    issues.push({
      code: 'missing-reference',
      message: `${owner} references missing ${targetKind}: ${id}`,
    })
  }
}

function validateExerciseInternalReferences(
  exercise: Exercise,
  concepts: ReadonlyMap<string, Concept>,
  issues: ContentValidationIssue[],
): void {
  switch (exercise.kind) {
    case 'single-choice': {
      const optionIds = new Set(exercise.options.map((option) => option.id))
      requireId(optionIds, exercise.checker.correctOptionId, exercise.id, 'option', issues)
      return
    }
    case 'multiple-choice': {
      const optionIds = new Set(exercise.options.map((option) => option.id))
      for (const optionId of exercise.checker.correctOptionIds) {
        requireId(optionIds, optionId, exercise.id, 'option', issues)
      }
      return
    }
    case 'micro-parsons': {
      const fragmentIds = new Set(exercise.fragments.map((fragment) => fragment.id))
      for (const fragmentId of exercise.checker.expectedFragmentIds) {
        requireId(fragmentIds, fragmentId, exercise.id, 'fragment', issues)
      }
      return
    }
    case 'line-parsons': {
      const lineIds = new Set(exercise.lines.map((line) => line.id))
      for (const lineId of exercise.checker.expectedLineIds) {
        requireId(lineIds, lineId, exercise.id, 'line', issues)
      }
      return
    }
    case 'fill-in-the-blanks':
      for (const blank of exercise.checker.blanks) {
        if (!exercise.template.includes(`__${blank.blankId}__`)) {
          issues.push({
            code: 'missing-reference',
            message: `${exercise.id} references missing blank marker: ${blank.blankId}`,
          })
        }
      }
      return
    case 'concept-matching': {
      const leftIds = new Set(exercise.leftItems.map((item) => item.id))
      const rightIds = new Set(exercise.rightItems.map((item) => item.id))
      for (const pair of exercise.checker.pairs) {
        requireId(leftIds, pair.leftId, exercise.id, 'left item', issues)
        requireId(rightIds, pair.rightId, exercise.id, 'right item', issues)
      }
      return
    }
    case 'scenario-based-transfer':
      for (const conceptId of exercise.checker.requiredConceptIds) {
        requireReference(concepts, conceptId, exercise.id, 'concept', issues)
      }
      return
    case 'true-false':
    case 'token-ordering':
    case 'output-prediction':
    case 'type-prediction':
    case 'code-debugging':
    case 'code-writing':
    case 'code-refactoring':
    case 'execution-tracing':
    case 'project-step':
    case 'self-check-question':
      return
  }
}

function detectCycles(edges: ReadonlyMap<string, readonly string[]>): readonly string[] {
  const visited = new Set<string>()
  const stack = new Set<string>()
  const cycles: string[] = []

  function visit(node: string, path: readonly string[]): void {
    if (stack.has(node)) {
      cycles.push([...path, node].join(' -> '))
      return
    }

    if (visited.has(node)) {
      return
    }

    visited.add(node)
    stack.add(node)

    for (const next of edges.get(node) ?? []) {
      visit(next, [...path, node])
    }

    stack.delete(node)
  }

  for (const node of edges.keys()) {
    visit(node, [])
  }

  return cycles
}

function collectReachableLessons(modules: ReadonlyMap<string, Module>): Set<string> {
  const reachableModules = new Set<string>()

  let changed = true
  while (changed) {
    changed = false
    for (const module of modules.values()) {
      if (reachableModules.has(module.id)) {
        continue
      }

      const prerequisitesReachable = module.prerequisiteModuleIds.every((id) =>
        reachableModules.has(id),
      )
      if (prerequisitesReachable) {
        reachableModules.add(module.id)
        changed = true
      }
    }
  }

  const lessons = new Set<string>()
  for (const moduleId of reachableModules) {
    for (const lessonId of modules.get(moduleId)?.lessonIds ?? []) {
      lessons.add(lessonId)
    }
  }

  return lessons
}

export async function loadContentSection(sectionId: ContentSectionId): Promise<ContentPackage> {
  const loader = sectionLoaders[sectionId]
  const section = await loader()
  return contentPackageSchema.parse(section.default)
}

export async function loadAllContentPackages(): Promise<readonly ContentPackage[]> {
  const manifest = contentManifestSchema.parse(contentManifest)
  const packages = await Promise.all(
    manifest.sections.map((section) => {
      if (!isContentSectionId(section.id)) {
        throw new Error(`No lazy loader registered for content section ${section.id}`)
      }

      return loadContentSection(section.id)
    }),
  )
  return packages
}

export function buildContentRegistry(packages: readonly ContentPackage[]): ContentRegistry {
  const issues = validateContentPackages(packages)
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))
  }

  const manifest = contentManifestSchema.parse(contentManifest)
  const course = packages[0]?.course
  if (!course) {
    throw new Error('Content registry requires at least one package')
  }

  const modules = new Map<string, Module>()
  const skills = new Map<string, Skill>()
  const lessons = new Map<string, Lesson>()
  const concepts = new Map<string, Concept>()
  const examples = new Map<string, Example>()
  const exercises = new Map<string, Exercise>()
  const explanations = new Map<string, Explanation>()
  const misconceptions = new Map<string, Misconception>()
  const countsBySection = new Map<string, ContentCounts>()

  for (const pkg of packages) {
    for (const item of pkg.modules) modules.set(item.id, item)
    for (const item of pkg.skills) skills.set(item.id, item)
    for (const item of pkg.lessons) lessons.set(item.id, item)
    for (const item of pkg.concepts) concepts.set(item.id, item)
    for (const item of pkg.examples) examples.set(item.id, item)
    for (const item of pkg.exercises) exercises.set(item.id, item)
    for (const item of pkg.explanations) explanations.set(item.id, item)
    for (const item of pkg.misconceptions) misconceptions.set(item.id, item)
    countsBySection.set(pkg.sectionId, {
      modules: pkg.modules.length,
      skills: pkg.skills.length,
      lessons: pkg.lessons.length,
      exercises: pkg.exercises.length,
      concepts: pkg.concepts.length,
      examples: pkg.examples.length,
    })
  }

  const skillDependencies = new Map<string, readonly string[]>()
  for (const skill of skills.values()) {
    skillDependencies.set(
      skill.id,
      skill.dependencies.map((dependency) => dependency.toSkillId),
    )
  }

  return {
    manifest,
    course,
    modules,
    skills,
    lessons,
    concepts,
    examples,
    exercises,
    explanations,
    misconceptions,
    skillDependencies,
    countsBySection,
  }
}

export function validateContentPackages(
  packages: readonly unknown[],
): readonly ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = []
  const manifestResult = contentManifestSchema.safeParse(contentManifest)
  if (!manifestResult.success) {
    return manifestResult.error.issues.map((issue) => ({
      code: 'schema',
      message: `Manifest schema error at ${issue.path.join('.')}: ${issue.message}`,
    }))
  }

  const parsedPackages: ContentPackage[] = []
  for (const item of packages) {
    const result = contentPackageSchema.safeParse(item)
    if (result.success) {
      parsedPackages.push(result.data)
    } else {
      issues.push(
        ...result.error.issues.map((issue) => ({
          code: 'schema' as const,
          message: `Content schema error at ${issue.path.join('.')}: ${issue.message}`,
        })),
      )
    }
  }

  if (issues.length > 0) {
    return issues
  }

  const manifest = manifestResult.data
  const modules = new Map<string, Module>()
  const skills = new Map<string, Skill>()
  const lessons = new Map<string, Lesson>()
  const concepts = new Map<string, Concept>()
  const examples = new Map<string, Example>()
  const exercises = new Map<string, Exercise>()
  const explanations = new Map<string, Explanation>()
  const misconceptions = new Map<string, Misconception>()
  const sectionIds = new Set(manifest.sections.map((section) => section.id))
  const manifestModuleIds = new Set<string>()
  for (const section of manifest.sections) {
    if (!isContentSectionId(section.id)) {
      issues.push({
        code: 'manifest-mismatch',
        message: `No lazy loader registered for content section ${section.id}`,
      })
    }

    for (const moduleId of section.moduleIds) {
      manifestModuleIds.add(moduleId)
    }
  }

  for (const pkg of parsedPackages) {
    if (pkg.contentVersion !== manifest.contentVersion) {
      issues.push({
        code: 'manifest-mismatch',
        message: `${pkg.sectionId} contentVersion ${pkg.contentVersion} does not match manifest ${manifest.contentVersion}`,
      })
    }

    if (!sectionIds.has(pkg.sectionId)) {
      issues.push({
        code: 'manifest-mismatch',
        message: `${pkg.sectionId} is not declared in manifest`,
      })
    }

    if (pkg.course.id !== manifest.courseId) {
      issues.push({
        code: 'manifest-mismatch',
        message: `${pkg.sectionId} course ${pkg.course.id} does not match manifest course ${manifest.courseId}`,
      })
    }

    for (const item of pkg.modules) addUnique(modules, item, 'module', issues)
    for (const item of pkg.skills) addUnique(skills, item, 'skill', issues)
    for (const item of pkg.lessons) addUnique(lessons, item, 'lesson', issues)
    for (const item of pkg.concepts) addUnique(concepts, item, 'concept', issues)
    for (const item of pkg.examples) addUnique(examples, item, 'example', issues)
    for (const item of pkg.exercises) addUnique(exercises, item, 'exercise', issues)
    for (const item of pkg.explanations) addUnique(explanations, item, 'explanation', issues)
    for (const item of pkg.misconceptions) addUnique(misconceptions, item, 'misconception', issues)
  }

  for (const moduleId of manifestModuleIds) {
    requireReference(modules, moduleId, 'manifest', 'module', issues)
  }

  for (const pkg of parsedPackages) {
    for (const moduleId of pkg.course.moduleIds) {
      requireReference(modules, moduleId, pkg.course.id, 'module', issues)
    }
    for (const exerciseId of pkg.course.diagnosticExerciseIds) {
      requireReference(exercises, exerciseId, pkg.course.id, 'exercise', issues)
    }
  }

  for (const module of modules.values()) {
    for (const lessonId of module.lessonIds) {
      requireReference(lessons, lessonId, module.id, 'lesson', issues)
    }
    for (const skillId of module.skillIds) {
      requireReference(skills, skillId, module.id, 'skill', issues)
    }
    for (const moduleId of module.prerequisiteModuleIds) {
      requireReference(modules, moduleId, module.id, 'module', issues)
    }
  }

  for (const skill of skills.values()) {
    for (const dependency of skill.dependencies) {
      requireReference(skills, dependency.fromSkillId, skill.id, 'skill', issues)
      requireReference(skills, dependency.toSkillId, skill.id, 'skill', issues)
    }
  }

  for (const lesson of lessons.values()) {
    requireReference(modules, lesson.moduleId, lesson.id, 'module', issues)
    for (const conceptId of lesson.conceptIds)
      requireReference(concepts, conceptId, lesson.id, 'concept', issues)
    for (const exampleId of lesson.exampleIds)
      requireReference(examples, exampleId, lesson.id, 'example', issues)
    for (const exerciseId of lesson.exerciseIds) {
      requireReference(exercises, exerciseId, lesson.id, 'exercise', issues)
    }
    for (const skillId of lesson.skillIds)
      requireReference(skills, skillId, lesson.id, 'skill', issues)
  }

  for (const concept of concepts.values()) {
    for (const skillId of concept.skillIds)
      requireReference(skills, skillId, concept.id, 'skill', issues)
    for (const misconceptionId of concept.misconceptionIds) {
      requireReference(misconceptions, misconceptionId, concept.id, 'misconception', issues)
    }
  }

  for (const example of examples.values()) {
    requireReference(lessons, example.lessonId, example.id, 'lesson', issues)
    requireReference(explanations, example.explanationId, example.id, 'explanation', issues)
  }

  for (const exercise of exercises.values()) {
    requireReference(lessons, exercise.lessonId, exercise.id, 'lesson', issues)
    requireReference(explanations, exercise.explanationId, exercise.id, 'explanation', issues)
    for (const skillId of exercise.skillIds)
      requireReference(skills, skillId, exercise.id, 'skill', issues)
    validateExerciseInternalReferences(exercise, concepts, issues)
  }

  const moduleEdges = new Map<string, readonly string[]>()
  for (const module of modules.values()) {
    moduleEdges.set(module.id, module.prerequisiteModuleIds)
  }

  const skillEdges = new Map<string, readonly string[]>()
  for (const skill of skills.values()) {
    skillEdges.set(
      skill.id,
      skill.dependencies.map((dependency) => dependency.toSkillId),
    )
  }

  for (const cycle of [...detectCycles(moduleEdges), ...detectCycles(skillEdges)]) {
    issues.push({
      code: 'cycle',
      message: cycle,
    })
  }

  const reachableLessons = collectReachableLessons(modules)
  for (const lesson of lessons.values()) {
    if (!reachableLessons.has(lesson.id)) {
      issues.push({
        code: 'unreachable-lesson',
        message: `Lesson ${lesson.id} is not reachable from root modules`,
      })
    }
  }

  return issues
}

export async function createContentRegistry(): Promise<ContentRegistry> {
  return buildContentRegistry(await loadAllContentPackages())
}
