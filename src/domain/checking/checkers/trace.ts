import { checkerResult } from '../result'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsStringArray, arraysEqual, normalizedText } from './common'

export function checkTrace(
  exercise: ExerciseWithKind<'execution-tracing'>,
  answer: ExerciseAnswer,
) {
  const actual = answerAsStringArray(answer).map(normalizedText)
  const expected = exercise.checker.expectedSteps.map(normalizedText)
  const passed = arraysEqual(actual, expected)

  return checkerResult({
    checker: 'trace',
    passed,
    matchedRules: passed ? expected.map((step) => `trace:${step}`) : [],
    failedRules: passed ? [] : ['trace-order'],
    normalizedAnswer: actual.join('\n'),
  })
}
