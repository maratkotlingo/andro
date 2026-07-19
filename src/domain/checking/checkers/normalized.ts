import { normalizeKotlinCode, normalizePlainText } from '../normalize'
import { checkerResult } from '../result'
import type { CanonicalSolution, ExerciseAnswer } from '../types'
import { answerAsString } from './common'

export function checkNormalizedText(
  answer: ExerciseAnswer,
  expected: string,
  options: {
    code?: boolean
    caseSensitive?: boolean
    solutions?: readonly CanonicalSolution[]
  } = {},
) {
  const normalize = options.code ? normalizeKotlinCode : normalizePlainText
  const maybeCase = (value: string) => (options.caseSensitive ? value : value.toLocaleLowerCase())
  const actual = maybeCase(normalize(answerAsString(answer)))
  const accepted = [{ id: 'canonical', answer: expected }, ...(options.solutions ?? [])]
  const matched = accepted.find((solution) => actual === maybeCase(normalize(solution.answer)))

  return checkerResult({
    checker: 'normalized-text',
    passed: matched !== undefined,
    matchedRules: matched ? [`solution:${matched.id}`] : [],
    failedRules: matched ? [] : ['normalized-text'],
    normalizedAnswer: actual,
  })
}
