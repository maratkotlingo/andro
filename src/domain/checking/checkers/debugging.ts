import { diagnoseKotlin } from '../diagnostics'
import { checkerResult, confidenceFor } from '../result'
import { tokenizeKotlin } from '../tokenize'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsString, containsImportantWords } from './common'

export function checkDebugging(
  exercise: ExerciseWithKind<'code-debugging'>,
  answer: ExerciseAnswer,
) {
  const source = answerAsString(answer)
  const tokens = tokenizeKotlin(source)
  const diagnostics = diagnoseKotlin(source, tokens)
  const matchedRules: string[] = []
  const failedRules: string[] = []

  for (const fix of exercise.checker.requiredFixes) {
    if (fixIsPresent(source, fix)) {
      matchedRules.push(`fix:${fix}`)
    } else {
      failedRules.push(`fix:${fix}`)
    }
  }

  for (const pattern of exercise.checker.forbiddenPatterns) {
    if (source.includes(pattern)) {
      failedRules.push(`forbidden:${pattern}`)
    } else {
      matchedRules.push(`forbidden:${pattern}`)
    }
  }

  const passed = failedRules.length === 0
  return checkerResult({
    checker: 'debugging',
    passed,
    matchedRules,
    failedRules,
    errorTags: diagnostics.tags,
    highlightedRanges: diagnostics.ranges,
    confidence: confidenceFor(passed, failedRules),
    tokens,
  })
}

function fixIsPresent(source: string, fix: string): boolean {
  if (fix === 'use-elvis') {
    return source.includes('?:') && !source.includes('!!')
  }
  return containsImportantWords(source, fix)
}
