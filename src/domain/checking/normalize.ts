import { tokenizeKotlin } from './tokenize'

export function normalizeNewlines(source: string): string {
  return source.replace(/\r\n?/g, '\n')
}

export function stripKotlinComments(source: string): string {
  const normalized = normalizeNewlines(source)
  let result = ''
  let index = 0

  while (index < normalized.length) {
    if (normalized.startsWith('//', index)) {
      index += 2
      while (index < normalized.length && normalized[index] !== '\n') {
        index += 1
      }
      if (normalized[index] === '\n') {
        result += '\n'
        index += 1
      }
      continue
    }

    if (normalized.startsWith('/*', index)) {
      const start = index
      index += 2
      let depth = 1
      while (index < normalized.length && depth > 0) {
        if (normalized.startsWith('/*', index)) {
          depth += 1
          index += 2
        } else if (normalized.startsWith('*/', index)) {
          depth -= 1
          index += 2
        } else {
          index += 1
        }
      }
      result += normalized.slice(start, index).replace(/[^\n]/g, ' ')
      continue
    }

    if (normalized.startsWith('"""', index)) {
      const start = index
      index += 3
      while (index < normalized.length && !normalized.startsWith('"""', index)) {
        index += 1
      }
      index = Math.min(normalized.length, index + 3)
      result += normalized.slice(start, index)
      continue
    }

    const char = normalized[index] ?? ''
    if (char === '"' || char === "'") {
      const start = index
      index = readEscapedLiteral(normalized, index, char)
      result += normalized.slice(start, index)
      continue
    }

    result += char
    index += 1
  }

  return result
}

export function normalizeWhitespace(source: string): string {
  return normalizeNewlines(source)
    .trim()
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n+/g, '\n')
}

export function normalizePlainText(source: string): string {
  return normalizeNewlines(source).trim().replace(/\s+/g, ' ')
}

export function normalizeKotlinCode(source: string): string {
  return tokenizeKotlin(stripKotlinComments(source))
    .map((token) => token.value)
    .join(' ')
}

export function tokenValues(source: string): readonly string[] {
  return tokenizeKotlin(stripKotlinComments(source)).map((token) => token.value)
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
