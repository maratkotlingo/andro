import { checkerResult } from '../result'
import type { ExerciseAnswer } from '../types'
import { answerAsString } from './common'

export function checkTypePrediction(
  answer: ExerciseAnswer,
  expectedType: string,
  acceptedAliases: readonly string[],
) {
  const actual = answerAsString(answer).trim()
  const accepted = new Set([expectedType, ...acceptedAliases])
  const passed = accepted.has(actual)

  return checkerResult({
    checker: 'type',
    passed,
    matchedRules: passed ? [`type:${actual}`] : [],
    failedRules: passed ? [] : ['type'],
    normalizedAnswer: actual,
  })
}
