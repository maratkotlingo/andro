import { tokenizeKotlin } from '../tokenize'
import { checkerResult } from '../result'
import type { ExerciseAnswer, IdentifierAliases, TokenPattern } from '../types'
import { codeTokensFromAnswer, tokensMatchPattern } from './common'

export function checkTokenSequence(
  answer: ExerciseAnswer,
  expectedTokens: readonly string[],
  options: {
    patterns?: readonly TokenPattern[] | undefined
    aliases?: IdentifierAliases | undefined
  } = {},
) {
  const actual = codeTokensFromAnswer(answer)
  const patterns = [
    { id: 'canonical', tokens: expectedTokens, identifierAliases: options.aliases },
    ...(options.patterns ?? []),
  ]
  const matched = patterns.find((pattern) =>
    tokensMatchPattern(actual, pattern.tokens, {
      ...(options.aliases ?? {}),
      ...(pattern.identifierAliases ?? {}),
    }),
  )

  return checkerResult({
    checker: 'token-sequence',
    passed: matched !== undefined,
    matchedRules: matched ? [`token-pattern:${matched.id}`] : [],
    failedRules: matched ? [] : ['token-sequence'],
    tokens: tokenizeKotlin(Array.isArray(answer) ? actual.join(' ') : String(answer ?? '')),
    normalizedAnswer: actual.join(' '),
  })
}
