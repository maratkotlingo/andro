import type { DiagnosticTag, KotlinToken, SourceRange } from './types'

export type DiagnosticScan = {
  tags: readonly DiagnosticTag[]
  ranges: readonly SourceRange[]
}

export function diagnoseKotlin(source: string, tokens: readonly KotlinToken[]): DiagnosticScan {
  const tags: DiagnosticTag[] = []
  const ranges: SourceRange[] = []

  addOperatorDiagnostic(tokens, '!!', 'nullable-access', tags, ranges)
  addOperatorDiagnostic(tokens, '===', 'wrong-equality', tags, ranges)
  addOperatorDiagnostic(tokens, '!==', 'wrong-equality', tags, ranges)

  for (const range of findValReassignmentRanges(tokens)) {
    tags.push('reassignment-of-val')
    ranges.push({ ...range, messageKey: 'feedback.reassignment-of-val' })
  }

  if (hasKeyword(tokens, 'when') && !hasKeyword(tokens, 'else')) {
    tags.push('missing-else')
  }

  if (source.includes('GlobalScope')) {
    tags.push('coroutine-scope-leak')
  }

  if (
    /catch\s*\(\s*(e\s*:\s*)?Exception\s*\)/.test(source) &&
    !source.includes('CancellationException')
  ) {
    tags.push('missing-cancellation-propagation')
  }

  if (source.includes('Dispatchers.Main') && /Thread\.sleep|blocking|readBytes\(/.test(source)) {
    tags.push('incorrect-dispatcher-usage')
  }

  if (source.includes('launch') && source.includes('async') && !source.includes('await')) {
    tags.push('lost-coroutine-exception')
  }

  if (/\bFlow\b|flow\s*\{/.test(source)) {
    if (!/\bcollect\b|\bstateIn\b|\bshareIn\b/.test(source)) {
      tags.push('flow-collection-misunderstanding')
    }
  }

  if (source.includes('mutableListOf') && /\bList\s*</.test(source)) {
    tags.push('mutable-read-only-collection-confusion')
  }

  if (source.includes('as?') && source.includes('!!')) {
    tags.push('wrong-smart-cast-assumption')
  }

  if (/\{\s*return\s+/.test(source) && !source.includes('return@')) {
    tags.push('wrong-return-scope')
  }

  if (source.includes('this@') || source.includes('with(')) {
    tags.push('wrong-lambda-receiver')
  }

  if (source.includes('asSequence()') && source.includes('.toList().map')) {
    tags.push('eager-lazy-collection-confusion')
  }

  return { tags: unique(tags), ranges }
}

function addOperatorDiagnostic(
  tokens: readonly KotlinToken[],
  operator: string,
  tag: DiagnosticTag,
  tags: DiagnosticTag[],
  ranges: SourceRange[],
): void {
  for (const token of tokens) {
    if (token.kind === 'operator' && token.value === operator) {
      tags.push(tag)
      ranges.push({ from: token.from, to: token.to, messageKey: `feedback.${tag}` })
    }
  }
}

function findValReassignmentRanges(tokens: readonly KotlinToken[]): readonly SourceRange[] {
  const valNames = new Set<string>()
  const ranges: SourceRange[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    const next = tokens[index + 1]
    if (token?.value === 'val' && next?.kind === 'identifier') {
      valNames.add(next.value)
    }
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index]
    const next = tokens[index + 1]
    if (
      token?.kind === 'identifier' &&
      valNames.has(token.value) &&
      next?.kind === 'operator' &&
      ['=', '+=', '-=', '*=', '/=', '%='].includes(next.value)
    ) {
      ranges.push({ from: token.from, to: next.to })
    }
  }

  return ranges
}

function hasKeyword(tokens: readonly KotlinToken[], keyword: string): boolean {
  return tokens.some((token) => token.kind === 'keyword' && token.value === keyword)
}

function unique<T>(items: readonly T[]): readonly T[] {
  return Array.from(new Set(items))
}
