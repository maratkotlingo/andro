import { checkerResult } from '../result'
import type { ExerciseAnswer } from '../types'
import { answerAsString, normalizedText } from './common'

export function checkOutput(
  answer: ExerciseAnswer,
  expectedOutput: string,
  normalizeWhitespace: boolean,
) {
  const actual = answerAsString(answer)
  const passed = normalizeWhitespace
    ? normalizedText(actual) === normalizedText(expectedOutput)
    : actual.trim() === expectedOutput.trim()

  return checkerResult({
    checker: 'output',
    passed,
    matchedRules: passed ? ['output'] : [],
    failedRules: passed ? [] : ['output'],
    normalizedAnswer: normalizeWhitespace ? normalizedText(actual) : actual.trim(),
  })
}
