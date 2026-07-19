import { diagnoseKotlin } from '../diagnostics'
import { checkerResult, confidenceFor } from '../result'
import { tokenizeKotlin } from '../tokenize'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsString, containsImportantWords } from './common'

export function checkRefactoring(
  exercise: ExerciseWithKind<'code-refactoring'>,
  answer: ExerciseAnswer,
) {
  const source = answerAsString(answer)
  const tokens = tokenizeKotlin(source)
  const diagnostics = diagnoseKotlin(source, tokens)
  const matchedRules: string[] = []
  const failedRules: string[] = []

  for (const behaviorCase of exercise.checker.preservedBehaviorCases) {
    if (preservedBehaviorMatches(source, behaviorCase)) {
      matchedRules.push(`behavior:${behaviorCase}`)
    } else {
      failedRules.push(`behavior:${behaviorCase}`)
    }
  }

  for (const change of exercise.checker.requiredChanges) {
    if (requiredChangeMatches(source, change)) {
      matchedRules.push(`change:${change}`)
    } else {
      failedRules.push(`change:${change}`)
    }
  }

  const passed = failedRules.length === 0
  return checkerResult({
    checker: 'refactoring',
    passed,
    matchedRules,
    failedRules,
    errorTags: diagnostics.tags,
    highlightedRanges: diagnostics.ranges,
    confidence: confidenceFor(passed, failedRules),
    tokens,
  })
}

function preservedBehaviorMatches(source: string, behaviorCase: string): boolean {
  if (behaviorCase === 'attempts-still-increments') {
    return /\battempts\s*(\+=|=)/.test(source) && source.includes('1')
  }
  return containsImportantWords(source, behaviorCase)
}

function requiredChangeMatches(source: string, change: string): boolean {
  if (change === 'course-to-val') {
    return /\bval\s+course\b/.test(source)
  }
  if (change === 'attempts-remains-var') {
    return /\bvar\s+attempts\b/.test(source)
  }
  return containsImportantWords(source, change)
}
