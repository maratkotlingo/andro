import type {
  CheckerKind,
  CheckerResult,
  ConfidenceLevel,
  DiagnosticTag,
  KotlinToken,
  SourceRange,
} from './types'

export type ResultInput = {
  checker: CheckerKind
  passed: boolean
  matchedRules?: readonly string[]
  failedRules?: readonly string[]
  errorTags?: readonly DiagnosticTag[]
  feedbackMessageKeys?: readonly string[]
  highlightedRanges?: readonly SourceRange[]
  confidence?: ConfidenceLevel
  normalizedAnswer?: string | undefined
  tokens?: readonly KotlinToken[] | undefined
}

export function checkerResult(input: ResultInput): CheckerResult {
  const errorTags = unique(input.errorTags ?? [])
  const feedbackMessageKeys = unique([
    `checker.${input.checker}.${input.passed ? 'passed' : 'failed'}`,
    ...errorTags.map((tag) => `feedback.${tag}`),
    ...(input.feedbackMessageKeys ?? []),
  ])

  return {
    checker: input.checker,
    passed: input.passed,
    matchedRules: unique(input.matchedRules ?? []),
    failedRules: unique(input.failedRules ?? []),
    errorTags,
    feedbackMessageKeys,
    highlightedRanges: input.highlightedRanges ?? [],
    confidence: input.confidence ?? 'high',
    ...(input.normalizedAnswer === undefined ? {} : { normalizedAnswer: input.normalizedAnswer }),
    ...(input.tokens === undefined ? {} : { tokens: input.tokens }),
  }
}

export function bestResult(results: readonly CheckerResult[]): CheckerResult {
  const passing = results.find((result) => result.passed)
  if (passing) {
    return passing
  }

  const first = results[0]
  if (!first) {
    return checkerResult({
      checker: 'normalized-text',
      passed: false,
      failedRules: ['no-checker-result'],
      confidence: 'low',
    })
  }

  return checkerResult({
    checker: first.checker,
    passed: false,
    matchedRules: results.flatMap((result) => [...result.matchedRules]),
    failedRules: results.flatMap((result) => [...result.failedRules]),
    errorTags: results.flatMap((result) => [...result.errorTags]),
    feedbackMessageKeys: results.flatMap((result) => [...result.feedbackMessageKeys]),
    highlightedRanges: results.flatMap((result) => [...result.highlightedRanges]),
    confidence: results.some((result) => result.confidence === 'medium') ? 'medium' : 'high',
    ...(first.normalizedAnswer === undefined ? {} : { normalizedAnswer: first.normalizedAnswer }),
    ...(first.tokens === undefined ? {} : { tokens: first.tokens }),
  })
}

export function confidenceFor(passed: boolean, failedRules: readonly string[]): ConfidenceLevel {
  if (passed) {
    return 'high'
  }
  if (failedRules.length <= 1) {
    return 'medium'
  }
  return 'high'
}

export function unique<T>(values: readonly T[]): readonly T[] {
  return Array.from(new Set(values))
}
