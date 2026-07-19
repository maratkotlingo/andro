import { describe, expect, it } from 'vitest'
import type { ContentPackage, Exercise, Module, Skill } from '../domain/model'
import { contentPackageSchema } from '../domain/model'
import {
  buildContentRegistry,
  loadAllContentPackages,
  validateContentPackages,
  type ContentValidationIssue,
} from './registry'
import foundationsPackage from './sections/foundations'
import { validateContentOrThrow } from './validation/validateContent'

function clonePackage(): ContentPackage {
  return contentPackageSchema.parse(JSON.parse(JSON.stringify(foundationsPackage)))
}

function requireItem<T>(items: readonly T[], index: number, label: string): T {
  const item = items[index]
  if (!item) {
    throw new Error(`Missing fixture item: ${label}`)
  }

  return item
}

function expectIssue(
  issues: readonly ContentValidationIssue[],
  code: ContentValidationIssue['code'],
  text: string,
): void {
  expect(issues.some((issue) => issue.code === code && issue.message.includes(text))).toBe(true)
}

describe('content registry', () => {
  it('loads lazy content sections and builds indexes with section counts', async () => {
    const packages = await loadAllContentPackages()
    const issues = validateContentPackages(packages)
    const registry = buildContentRegistry(packages)

    await expect(validateContentOrThrow()).resolves.toBeUndefined()
    expect(issues).toEqual([])
    expect(registry.modules.has('module.kotlin-foundations')).toBe(true)
    expect(registry.skills.has('skill.null-safety')).toBe(true)
    expect(registry.lessons.has('lesson.kotlin-values')).toBe(true)
    expect(registry.exercises.size).toBe(17)
    expect(registry.countsBySection.get('foundations')).toEqual({
      modules: 1,
      skills: 4,
      lessons: 1,
      exercises: 17,
      concepts: 2,
      examples: 1,
    })
  })

  it('detects duplicate identifiers before building the registry', () => {
    const pkg = clonePackage()
    const first = requireItem(pkg.exercises, 0, 'first exercise')
    const second = requireItem(pkg.exercises, 1, 'second exercise')
    pkg.exercises[1] = { ...second, id: first.id } as Exercise

    const issues = validateContentPackages([pkg])

    expectIssue(issues, 'duplicate-id', first.id)
    expect(() => buildContentRegistry([pkg])).toThrow(first.id)
  })

  it('detects broken references between content entities', () => {
    const pkg = clonePackage()
    const lesson = requireItem(pkg.lessons, 0, 'lesson')
    pkg.lessons[0] = {
      ...lesson,
      conceptIds: ['concept.missing'],
    }

    const issues = validateContentPackages([pkg])

    expectIssue(issues, 'missing-reference', 'concept.missing')
  })

  it('detects exercise-local broken references', () => {
    const pkg = clonePackage()
    const exerciseIndex = pkg.exercises.findIndex((exercise) => exercise.kind === 'single-choice')
    const exercise = pkg.exercises[exerciseIndex]
    if (!exercise || exercise.kind !== 'single-choice') {
      throw new Error('Missing single-choice fixture')
    }
    pkg.exercises[exerciseIndex] = {
      ...exercise,
      checker: {
        ...exercise.checker,
        correctOptionId: 'option.missing',
      },
    }

    const issues = validateContentPackages([pkg])

    expectIssue(issues, 'missing-reference', 'option.missing')
  })

  it('detects cycles in prerequisite graphs', () => {
    const pkg = clonePackage()
    const skill = requireItem(pkg.skills, 0, 'skill')
    pkg.skills[0] = {
      ...skill,
      dependencies: [
        {
          fromSkillId: skill.id,
          toSkillId: skill.id,
          kind: 'prerequisite',
        },
      ],
    } satisfies Skill

    const issues = validateContentPackages([pkg])

    expectIssue(issues, 'cycle', `${skill.id} -> ${skill.id}`)
  })

  it('detects unreachable lessons when module prerequisites cannot open', () => {
    const pkg = clonePackage()
    const module = requireItem(pkg.modules, 0, 'module')
    pkg.modules[0] = {
      ...module,
      prerequisiteModuleIds: [module.id],
    } satisfies Module

    const issues = validateContentPackages([pkg])

    expectIssue(issues, 'unreachable-lesson', 'lesson.kotlin-values')
  })
})
