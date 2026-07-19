import type { ExerciseAnswer, CanonicalSolution } from '../types'
import { checkerResult } from '../result'
import { answerAsString } from './common'

export function checkExactAnswer(
  answer: ExerciseAnswer,
  expected: string,
  solutions: readonly CanonicalSolution[] = [],
) {
  const actual = answerAsString(answer).trim()
  const accepted = [{ id: 'canonical', answer: expected }, ...solutions]
  const matched = accepted.find((solution) => actual === solution.answer.trim())

  return checkerResult({
    checker: 'exact-answer',
    passed: matched !== undefined,
    matchedRules: matched ? [`solution:${matched.id}`] : [],
    failedRules: matched ? [] : ['exact-answer'],
    normalizedAnswer: actual,
  })
}
