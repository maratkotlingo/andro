import { checkerResult } from '../result'
import type { ExerciseAnswer } from '../types'
import { codeTokensFromAnswer, multisetsEqual } from './common'

export function checkUnorderedTokens(answer: ExerciseAnswer, expectedTokens: readonly string[]) {
  const actual = codeTokensFromAnswer(answer)
  const passed = multisetsEqual(actual, expectedTokens)

  return checkerResult({
    checker: 'unordered-token',
    passed,
    matchedRules: passed ? ['unordered-token-set'] : [],
    failedRules: passed ? [] : ['unordered-token-set'],
    normalizedAnswer: actual.join(' '),
  })
}
