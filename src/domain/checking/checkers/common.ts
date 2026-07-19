import { normalizeKotlinCode, normalizePlainText, tokenValues } from '../normalize'
import type { IdentifierAliases } from '../types'

export function answerAsString(answer: unknown): string {
  return typeof answer === 'string' ? answer : ''
}

export function answerAsStringArray(answer: unknown): readonly string[] {
  if (Array.isArray(answer)) {
    return answer.filter((item): item is string => typeof item === 'string')
  }
  if (typeof answer === 'string') {
    return answer
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export function answerAsRecord(answer: unknown): Readonly<Record<string, string>> {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
    return {}
  }

  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(answer)) {
    if (typeof value === 'string') {
      output[key] = value
    }
  }
  return output
}

export function normalizedText(value: string): string {
  return normalizePlainText(value).toLocaleLowerCase()
}

export function normalizedCode(value: string): string {
  return normalizeKotlinCode(value)
}

export function codeTokensFromAnswer(answer: unknown): readonly string[] {
  if (Array.isArray(answer)) {
    return answer.filter((item): item is string => typeof item === 'string')
  }
  return tokenValues(answerAsString(answer))
}

export function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

export function multisetsEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false
  }

  const counts = new Map<string, number>()
  for (const item of left) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }

  for (const item of right) {
    const count = counts.get(item) ?? 0
    if (count === 0) {
      return false
    }
    if (count === 1) {
      counts.delete(item)
    } else {
      counts.set(item, count - 1)
    }
  }

  return counts.size === 0
}

export function tokensMatchPattern(
  actual: readonly string[],
  expected: readonly string[],
  aliases: IdentifierAliases = {},
): boolean {
  if (actual.length !== expected.length) {
    return false
  }

  return actual.every((token, index) => tokenMatches(token, expected[index] ?? '', aliases))
}

export function tokenMatches(
  actual: string,
  expected: string,
  aliases: IdentifierAliases = {},
): boolean {
  if (actual === expected) {
    return true
  }

  if (aliases[expected]?.includes(actual)) {
    return true
  }

  return Object.entries(aliases).some(
    ([canonical, values]) => actual === canonical && values.includes(expected),
  )
}

export function containsImportantWords(answer: string, phrase: string): boolean {
  const normalizedAnswer = normalizedText(answer)
  const importantWords = phrase
    .toLocaleLowerCase()
    .split(/[^a-z0-9а-яё]+/iu)
    .filter(
      (word) => word.length >= 2 && !['the', 'and', 'use', 'uses', 'does', 'not'].includes(word),
    )

  return importantWords.every((word) => normalizedAnswer.includes(word))
}
