import { normalizeKotlinCode } from './normalize'
import { tokenizeKotlin } from './tokenize'
import type { DiagnosticTag, KotlinToken, SourceRange, StructuralRule } from './types'

export type StructuralEvaluation = {
  passed: boolean
  matchedRules: readonly string[]
  failedRules: readonly string[]
  errorTags: readonly DiagnosticTag[]
  highlightedRanges: readonly SourceRange[]
  tokens: readonly KotlinToken[]
  normalizedAnswer: string
}

export function evaluateStructuralRules(
  source: string,
  rules: readonly StructuralRule[],
): StructuralEvaluation {
  const tokens = tokenizeKotlin(source)
  const normalizedAnswer = normalizeKotlinCode(source)
  const matchedRules: string[] = []
  const failedRules: string[] = []
  const errorTags: DiagnosticTag[] = []
  const highlightedRanges: SourceRange[] = []

  for (const rule of rules) {
    const result = evaluateRule(tokens, normalizedAnswer, rule)
    const ruleId = structuralRuleId(rule)
    if (result.passed) {
      matchedRules.push(ruleId)
    } else {
      failedRules.push(ruleId)
      if (result.tag) {
        errorTags.push(result.tag)
      }
    }
    highlightedRanges.push(...result.ranges)
  }

  return {
    passed: failedRules.length === 0,
    matchedRules,
    failedRules,
    errorTags: unique(errorTags),
    highlightedRanges,
    tokens,
    normalizedAnswer,
  }
}

export function structuralRuleId(rule: StructuralRule): string {
  if (rule.id) {
    return rule.id
  }

  switch (rule.kind) {
    case 'required-keyword':
      return `required-keyword:${rule.keyword}`
    case 'forbidden-keyword':
      return `forbidden-keyword:${rule.keyword}`
    case 'required-operator':
      return `required-operator:${rule.operator}`
    case 'forbidden-operator':
      return `forbidden-operator:${rule.operator}`
    case 'required-function-call':
      return `required-function-call:${rule.name}`
    case 'forbidden-function-call':
      return `forbidden-function-call:${rule.name}`
    case 'required-declaration':
      return `required-declaration:${rule.declaration}:${rule.name ?? '*'}`
    case 'required-type-annotation':
      return `required-type-annotation:${rule.identifier ?? '*'}:${rule.typeName ?? '*'}`
    case 'allowed-identifier-aliases':
      return `allowed-identifier-aliases:${rule.canonical}`
    case 'ordered-constructs':
      return `ordered-constructs:${rule.constructs.join('>')}`
    case 'maximum-construct-count':
      return `maximum-construct-count:${rule.construct}:${rule.count}`
    case 'minimum-construct-count':
      return `minimum-construct-count:${rule.construct}:${rule.count}`
    case 'balanced-delimiters':
      return 'balanced-delimiters'
    case 'required-branch':
      return `required-branch:${rule.branch}`
    case 'exhaustive-when':
      return 'exhaustive-when'
    case 'nullable-access-pattern':
      return `nullable-access-pattern:${rule.pattern}`
    case 'required-suspend-modifier':
      return 'required-suspend-modifier'
    case 'required-coroutine-builder':
      return `required-coroutine-builder:${rule.builders.join('|')}`
    case 'expected-flow-operator-sequence':
      return `expected-flow-operator-sequence:${rule.operators.join('>')}`
  }
}

type RuleEvaluation = {
  passed: boolean
  tag?: DiagnosticTag | undefined
  ranges: readonly SourceRange[]
}

function evaluateRule(
  tokens: readonly KotlinToken[],
  normalizedAnswer: string,
  rule: StructuralRule,
): RuleEvaluation {
  switch (rule.kind) {
    case 'required-keyword':
      return passIf(hasToken(tokens, 'keyword', rule.keyword), 'missing-construct')
    case 'forbidden-keyword': {
      const ranges = rangesForToken(tokens, rule.keyword)
      return {
        passed: ranges.length === 0,
        tag: ranges.length > 0 ? (rule.tag ?? 'forbidden-construct') : undefined,
        ranges,
      }
    }
    case 'required-operator':
      return passIf(hasToken(tokens, 'operator', rule.operator), rule.tag ?? 'missing-construct')
    case 'forbidden-operator': {
      const ranges = rangesForToken(tokens, rule.operator)
      return {
        passed: ranges.length === 0,
        tag: ranges.length > 0 ? (rule.tag ?? 'forbidden-construct') : undefined,
        ranges,
      }
    }
    case 'required-function-call':
      return passIf(hasFunctionCall(tokens, rule.name, rule.aliases), 'missing-construct')
    case 'forbidden-function-call': {
      const ranges = functionCallRanges(tokens, rule.name)
      return {
        passed: ranges.length === 0,
        tag: ranges.length > 0 ? (rule.tag ?? 'forbidden-construct') : undefined,
        ranges,
      }
    }
    case 'required-declaration':
      return passIf(
        hasDeclaration(tokens, rule.declaration, rule.name, rule.aliases),
        'missing-construct',
      )
    case 'required-type-annotation':
      return passIf(hasTypeAnnotation(tokens, rule.identifier, rule.typeName), 'missing-construct')
    case 'allowed-identifier-aliases':
      return passIf(
        tokens.some(
          (token) =>
            token.kind === 'identifier' &&
            (token.value === rule.canonical || rule.aliases.includes(token.value)),
        ),
        'missing-construct',
      )
    case 'ordered-constructs':
      return passIf(constructsAreOrdered(tokens, rule.constructs), 'syntax-shape')
    case 'maximum-construct-count':
      return passIf(
        countConstruct(tokens, rule.construct) <= rule.count,
        rule.tag ?? 'forbidden-construct',
      )
    case 'minimum-construct-count':
      return passIf(countConstruct(tokens, rule.construct) >= rule.count, 'missing-construct')
    case 'balanced-delimiters':
      return balancedDelimiters(tokens)
    case 'required-branch':
      return passIf(
        normalizedAnswer.includes(normalizeKotlinCode(rule.branch)),
        rule.tag ?? 'missing-construct',
      )
    case 'exhaustive-when': {
      const hasWhen = hasToken(tokens, 'keyword', 'when')
      const hasElse = hasToken(tokens, 'keyword', 'else')
      const hasBranches = (rule.branches ?? []).every((branch) =>
        normalizedAnswer.includes(normalizeKotlinCode(branch)),
      )
      return passIf(
        hasWhen && hasElse && hasBranches,
        hasElse ? 'missing-construct' : 'missing-else',
      )
    }
    case 'nullable-access-pattern':
      if (rule.pattern === 'safe-call') {
        return passIf(hasToken(tokens, 'operator', '?.'), 'nullable-access')
      }
      if (rule.pattern === 'elvis') {
        return passIf(hasToken(tokens, 'operator', '?:'), 'nullable-access')
      }
      return {
        passed: !hasToken(tokens, 'operator', '!!'),
        tag: hasToken(tokens, 'operator', '!!') ? 'nullable-access' : undefined,
        ranges: rangesForToken(tokens, '!!'),
      }
    case 'required-suspend-modifier':
      return passIf(hasToken(tokens, 'keyword', 'suspend'), 'missing-construct')
    case 'required-coroutine-builder':
      return passIf(
        rule.builders.some((builder) => hasFunctionCall(tokens, builder)),
        'missing-construct',
      )
    case 'expected-flow-operator-sequence':
      return passIf(
        functionCallsAreOrdered(tokens, rule.operators),
        'flow-collection-misunderstanding',
      )
  }
}

function passIf(passed: boolean, tag: DiagnosticTag): RuleEvaluation {
  return {
    passed,
    tag: passed ? undefined : tag,
    ranges: [],
  }
}

function hasToken(
  tokens: readonly KotlinToken[],
  kind: KotlinToken['kind'],
  value: string,
): boolean {
  return tokens.some((token) => token.kind === kind && token.value === value)
}

function rangesForToken(tokens: readonly KotlinToken[], value: string): readonly SourceRange[] {
  return tokens
    .filter((token) => token.value === value)
    .map((token) => ({ from: token.from, to: token.to }))
}

function hasFunctionCall(
  tokens: readonly KotlinToken[],
  name: string,
  aliases: readonly string[] = [],
): boolean {
  const names = new Set([name, ...aliases])
  return functionCallRanges(tokens, names).length > 0
}

function functionCallRanges(
  tokens: readonly KotlinToken[],
  nameOrNames: string | ReadonlySet<string>,
): readonly SourceRange[] {
  const names = typeof nameOrNames === 'string' ? new Set([nameOrNames]) : nameOrNames
  const ranges: SourceRange[] = []
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index]
    const next = tokens[index + 1]
    if (
      token?.kind === 'identifier' &&
      names.has(token.value) &&
      (next?.value === '(' || next?.value === '{')
    ) {
      ranges.push({ from: token.from, to: next.to })
    }
  }
  return ranges
}

function hasDeclaration(
  tokens: readonly KotlinToken[],
  declaration: string,
  name?: string,
  aliases: readonly string[] = [],
): boolean {
  const names = name ? new Set([name, ...aliases]) : null
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token?.value !== declaration) {
      continue
    }
    if (!names) {
      return true
    }
    const next = nextDeclarationName(tokens, index + 1)
    if (next?.kind === 'identifier' && names.has(next.value)) {
      return true
    }
  }
  return false
}

function nextDeclarationName(
  tokens: readonly KotlinToken[],
  startIndex: number,
): KotlinToken | undefined {
  let index = startIndex
  if (tokens[index]?.value === '<') {
    let depth = 0
    while (index < tokens.length) {
      const value = tokens[index]?.value
      if (value === '<') {
        depth += 1
      } else if (value === '>') {
        depth -= 1
        if (depth === 0) {
          index += 1
          break
        }
      }
      index += 1
    }
  }
  return tokens[index]
}

function hasTypeAnnotation(
  tokens: readonly KotlinToken[],
  identifier?: string,
  typeName?: string,
): boolean {
  for (let index = 0; index < tokens.length - 2; index += 1) {
    const name = tokens[index]
    const colon = tokens[index + 1]
    const type = tokens[index + 2]
    if (name?.kind !== 'identifier' || colon?.value !== ':' || !type) {
      continue
    }
    if (identifier && name.value !== identifier) {
      continue
    }
    if (typeName && type.value !== typeName) {
      continue
    }
    return true
  }
  return false
}

function constructsAreOrdered(
  tokens: readonly KotlinToken[],
  constructs: readonly string[],
): boolean {
  let cursor = -1
  for (const construct of constructs) {
    const found = tokens.findIndex((token, index) => index > cursor && token.value === construct)
    if (found === -1) {
      return false
    }
    cursor = found
  }
  return true
}

function functionCallsAreOrdered(
  tokens: readonly KotlinToken[],
  operators: readonly string[],
): boolean {
  let cursor = -1
  for (const operator of operators) {
    let found = -1
    for (let index = cursor + 1; index < tokens.length - 1; index += 1) {
      if (
        tokens[index]?.value === operator &&
        (tokens[index + 1]?.value === '(' || tokens[index + 1]?.value === '{')
      ) {
        found = index
        break
      }
    }
    if (found === -1) {
      return false
    }
    cursor = found
  }
  return true
}

function countConstruct(tokens: readonly KotlinToken[], construct: string): number {
  let count = 0
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index]?.value === construct) {
      count += 1
    }
  }
  return count
}

function balancedDelimiters(tokens: readonly KotlinToken[]): RuleEvaluation {
  const openToClose: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  }
  const closeToOpen: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
  }
  const stack: KotlinToken[] = []
  const ranges: SourceRange[] = []

  for (const token of tokens) {
    if (token.value in openToClose) {
      stack.push(token)
      continue
    }
    if (token.value in closeToOpen) {
      const expectedOpen = closeToOpen[token.value]
      const last = stack.pop()
      if (!last || last.value !== expectedOpen) {
        ranges.push({ from: token.from, to: token.to, messageKey: 'feedback.syntax-shape' })
      }
    }
  }

  for (const token of stack) {
    ranges.push({ from: token.from, to: token.to, messageKey: 'feedback.syntax-shape' })
  }

  return {
    passed: ranges.length === 0,
    tag: ranges.length > 0 ? 'syntax-shape' : undefined,
    ranges,
  }
}

function unique<T>(items: readonly T[]): readonly T[] {
  return Array.from(new Set(items))
}
