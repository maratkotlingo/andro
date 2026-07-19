import type { KotlinToken } from './types'

export type TokenizeOptions = {
  includeComments?: boolean
}

const keywords = new Set([
  'as',
  'break',
  'class',
  'continue',
  'do',
  'else',
  'false',
  'for',
  'fun',
  'if',
  'in',
  'interface',
  'is',
  'null',
  'object',
  'package',
  'return',
  'super',
  'this',
  'throw',
  'true',
  'try',
  'typealias',
  'typeof',
  'val',
  'var',
  'when',
  'while',
  'by',
  'catch',
  'constructor',
  'delegate',
  'dynamic',
  'field',
  'file',
  'finally',
  'get',
  'import',
  'init',
  'param',
  'property',
  'receiver',
  'set',
  'setparam',
  'where',
  'actual',
  'abstract',
  'annotation',
  'companion',
  'const',
  'crossinline',
  'data',
  'enum',
  'expect',
  'external',
  'final',
  'infix',
  'inline',
  'inner',
  'internal',
  'lateinit',
  'noinline',
  'open',
  'operator',
  'out',
  'override',
  'private',
  'protected',
  'public',
  'reified',
  'sealed',
  'suspend',
  'tailrec',
  'vararg',
])

const operators = [
  '!==',
  '===',
  '>>>',
  '?:',
  '?.',
  '!!',
  '::',
  '->',
  '..<',
  '..',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '>=',
  '<=',
  '==',
  '!=',
  '&&',
  '||',
  '++',
  '--',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '>',
  '<',
  '!',
  '?',
  ':',
  '.',
  '@',
]

const punctuation = new Set(['(', ')', '{', '}', '[', ']', ',', ';'])

export function isKotlinKeyword(value: string): boolean {
  return keywords.has(value)
}

export function tokenizeKotlin(
  source: string,
  options: TokenizeOptions = {},
): readonly KotlinToken[] {
  const tokens: KotlinToken[] = []
  let index = 0

  while (index < source.length) {
    const char = source[index] ?? ''

    if (isWhitespace(char)) {
      index += 1
      continue
    }

    if (source.startsWith('//', index)) {
      const from = index
      index = readLineComment(source, index)
      pushComment(tokens, source, from, index, options.includeComments)
      continue
    }

    if (source.startsWith('/*', index)) {
      const from = index
      index = readBlockComment(source, index)
      pushComment(tokens, source, from, index, options.includeComments)
      continue
    }

    if (source.startsWith('"""', index)) {
      const from = index
      index = readTripleQuotedString(source, index)
      tokens.push({ kind: 'literal', value: source.slice(from, index), from, to: index })
      continue
    }

    if (char === '"' || char === "'") {
      const from = index
      index = readEscapedLiteral(source, index, char)
      tokens.push({ kind: 'literal', value: source.slice(from, index), from, to: index })
      continue
    }

    if (isDigit(char)) {
      const from = index
      index = readNumber(source, index)
      tokens.push({ kind: 'literal', value: source.slice(from, index), from, to: index })
      continue
    }

    if (isIdentifierStart(char)) {
      const from = index
      index += 1
      while (index < source.length && isIdentifierPart(source[index] ?? '')) {
        index += 1
      }
      const value = source.slice(from, index)
      tokens.push({ kind: keywords.has(value) ? 'keyword' : 'identifier', value, from, to: index })
      continue
    }

    const operator = operators.find((candidate) => source.startsWith(candidate, index))
    if (operator) {
      tokens.push({ kind: 'operator', value: operator, from: index, to: index + operator.length })
      index += operator.length
      continue
    }

    if (punctuation.has(char)) {
      tokens.push({ kind: 'punctuation', value: char, from: index, to: index + 1 })
      index += 1
      continue
    }

    tokens.push({ kind: 'punctuation', value: char, from: index, to: index + 1 })
    index += 1
  }

  return tokens
}

function pushComment(
  tokens: KotlinToken[],
  source: string,
  from: number,
  to: number,
  includeComments = false,
): void {
  if (includeComments) {
    tokens.push({ kind: 'comment', value: source.slice(from, to), from, to })
  }
}

function readLineComment(source: string, index: number): number {
  let cursor = index + 2
  while (cursor < source.length && source[cursor] !== '\n' && source[cursor] !== '\r') {
    cursor += 1
  }
  return cursor
}

function readBlockComment(source: string, index: number): number {
  let cursor = index + 2
  let depth = 1
  while (cursor < source.length && depth > 0) {
    if (source.startsWith('/*', cursor)) {
      depth += 1
      cursor += 2
    } else if (source.startsWith('*/', cursor)) {
      depth -= 1
      cursor += 2
    } else {
      cursor += 1
    }
  }
  return cursor
}

function readTripleQuotedString(source: string, index: number): number {
  let cursor = index + 3
  while (cursor < source.length && !source.startsWith('"""', cursor)) {
    cursor += 1
  }
  return Math.min(source.length, cursor + 3)
}

function readEscapedLiteral(source: string, index: number, quote: string): number {
  let cursor = index + 1
  let escaped = false
  while (cursor < source.length) {
    const char = source[cursor]
    cursor += 1
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === quote) {
      break
    }
  }
  return cursor
}

function readNumber(source: string, index: number): number {
  let cursor = index
  while (cursor < source.length && /[0-9_a-fA-FxXbB.eE+-]/.test(source[cursor] ?? '')) {
    const previous = source[cursor - 1]
    const current = source[cursor]
    if ((current === '+' || current === '-') && previous !== 'e' && previous !== 'E') {
      break
    }
    cursor += 1
  }
  while (cursor < source.length && /[uUlLfF]/.test(source[cursor] ?? '')) {
    cursor += 1
  }
  return cursor
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char)
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char)
}

function isIdentifierStart(char: string): boolean {
  return /[\p{L}_]/u.test(char)
}

function isIdentifierPart(char: string): boolean {
  return /[\p{L}\p{N}_]/u.test(char)
}
