import { checkerResult } from '../result'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsString, containsImportantWords, normalizedText } from './common'

export function checkScenarioTransfer(
  exercise: ExerciseWithKind<'scenario-based-transfer'>,
  answer: ExerciseAnswer,
) {
  const text = answerAsString(answer)
  const matchedRules: string[] = []
  const failedRules: string[] = []

  for (const conceptId of exercise.checker.requiredConceptIds) {
    if (conceptRequirementMatches(text, conceptId)) {
      matchedRules.push(`concept:${conceptId}`)
    } else {
      failedRules.push(`concept:${conceptId}`)
    }
  }

  if (
    exercise.checker.acceptedSolutionIds.some((solutionId) => solutionMatches(text, solutionId))
  ) {
    matchedRules.push('accepted-solution')
  } else {
    failedRules.push('accepted-solution')
  }

  return checkerResult({
    checker: 'project-step',
    passed: failedRules.length === 0,
    matchedRules,
    failedRules,
    confidence: 'medium',
  })
}

export function checkProjectStep(
  exercise: ExerciseWithKind<'project-step'>,
  answer: ExerciseAnswer,
) {
  const text = answerAsString(answer)
  const matchedRules: string[] = []
  const failedRules: string[] = []

  for (const artifact of exercise.checker.requiredArtifacts) {
    if (containsImportantWords(text, artifact)) {
      matchedRules.push(`artifact:${artifact}`)
    } else {
      failedRules.push(`artifact:${artifact}`)
    }
  }

  for (const rule of exercise.checker.acceptanceRules) {
    if (acceptanceRuleMatches(text, rule)) {
      matchedRules.push(`acceptance:${rule}`)
    } else {
      failedRules.push(`acceptance:${rule}`)
    }
  }

  return checkerResult({
    checker: 'project-step',
    passed: failedRules.length === 0,
    matchedRules,
    failedRules,
    confidence: 'medium',
  })
}

export function checkSelfCheck(
  exercise: ExerciseWithKind<'self-check-question'>,
  answer: ExerciseAnswer,
) {
  const text = answerAsString(answer).trim()
  const matchedRules: string[] = []
  const failedRules: string[] = []

  if (text.length >= exercise.checker.minLength) {
    matchedRules.push('min-length')
  } else {
    failedRules.push('min-length')
  }

  for (const reflectionId of exercise.checker.requiredReflectionIds) {
    if (reflectionMatches(text, reflectionId)) {
      matchedRules.push(`reflection:${reflectionId}`)
    } else {
      failedRules.push(`reflection:${reflectionId}`)
    }
  }

  return checkerResult({
    checker: 'project-step',
    passed: failedRules.length === 0,
    matchedRules,
    failedRules,
    confidence: 'low',
  })
}

function conceptRequirementMatches(text: string, conceptId: string): boolean {
  if (conceptId.includes('elvis')) {
    return /\?:|elvis|fallback|guest/i.test(text) && avoidsNotNullAssertion(text)
  }
  return containsImportantWords(text, conceptId)
}

function solutionMatches(text: string, solutionId: string): boolean {
  if (solutionId.includes('display-name') && solutionId.includes('elvis')) {
    return (
      /\?:|elvis|fallback|guest/i.test(text) &&
      /display\s*name|displayName/i.test(text) &&
      avoidsNotNullAssertion(text)
    )
  }
  return containsImportantWords(text, solutionId)
}

function acceptanceRuleMatches(text: string, rule: string): boolean {
  const normalized = normalizedText(text)
  if (rule.startsWith('does not use ')) {
    const forbidden = rule.replace('does not use ', '').trim()
    return !text.includes(forbidden) || normalized.includes(`does not use ${forbidden}`)
  }
  if (rule === 'uses data class') {
    return /data\s+class/i.test(text)
  }
  return containsImportantWords(normalized, rule)
}

function avoidsNotNullAssertion(text: string): boolean {
  return (
    !text.includes('!!') ||
    /\b(avoid|avoids|without|no|never)\b[^.!?\n]*!!/i.test(text) ||
    normalizedText(text).includes('does not use !!')
  )
}

function reflectionMatches(text: string, reflectionId: string): boolean {
  const normalized = normalizedText(text)
  if (reflectionId.includes('intent')) {
    return /intent|need|purpose|when|если|когда|нужно|намер/i.test(normalized)
  }
  if (reflectionId.includes('reassignment')) {
    return /reassign|change|update|измен|переназнач/i.test(normalized)
  }
  return containsImportantWords(text, reflectionId)
}
