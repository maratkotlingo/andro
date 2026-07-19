import { checkerResult } from '../result'
import type { ExerciseAnswer } from '../types'
import { answerAsStringArray, arraysEqual } from './common'

export function checkParsons(
  answer: ExerciseAnswer,
  expectedIds: readonly string[],
  alternatives: readonly (readonly string[])[] = [],
) {
  const actual = answerAsStringArray(answer)
  const acceptedOrders = [expectedIds, ...alternatives]
  const matched = acceptedOrders.find((order) => arraysEqual(actual, order))

  return checkerResult({
    checker: 'parsons',
    passed: matched !== undefined,
    matchedRules: matched ? ['parsons-order'] : [],
    failedRules: matched ? [] : ['parsons-order'],
    normalizedAnswer: actual.join('\n'),
  })
}
