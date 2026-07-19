import { z } from 'zod'

export type JsonParseResult<T> = { ok: true; value: T } | { ok: false; reason: string; raw: string }

export function parseJsonWithSchema<T>(raw: string, schema: z.ZodType<T>): JsonParseResult<T> {
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      return {
        ok: false,
        reason: result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
        raw,
      }
    }

    return {
      ok: true,
      value: result.data,
    }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Invalid JSON',
      raw,
    }
  }
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value), null, 2)
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortJson(entry)]),
    )
  }

  return value
}

export function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }
  return `djb2-${(hash >>> 0).toString(16)}`
}
