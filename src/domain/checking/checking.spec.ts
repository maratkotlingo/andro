import { describe, expect, it } from 'vitest'
import foundationsPackage from '../../content/sections/foundations'
import { contentPackageSchema, type Exercise } from '../model'
import {
  checkExactAnswer,
  checkExerciseAnswer,
  checkNormalizedText,
  checkTokenSequence,
  checkUnorderedTokens,
  diagnoseKotlin,
  evaluateStructuralRules,
  normalizeKotlinCode,
  stripKotlinComments,
  tokenizeKotlin,
} from './index'

const contentPackage = contentPackageSchema.parse(foundationsPackage)

describe('Kotlin normalization and tokenization', () => {
  it('removes insignificant whitespace and comments while preserving strings', () => {
    const source = String.raw`val text = "http://site/*keep*/" // remove
val name = "A\"B"`

    expect(stripKotlinComments(source)).not.toContain('remove')
    expect(stripKotlinComments(source)).toContain('"http://site/*keep*/"')
    expect(normalizeKotlinCode(source)).toBe(
      String.raw`val text = "http://site/*keep*/" val name = "A\"B"`,
    )
  })

  it('distinguishes identifiers, keywords, literals, operators and punctuation', () => {
    const tokens = tokenizeKotlin('val displayName = user?.name ?: "Guest"')

    expect(tokens.map((token) => [token.kind, token.value])).toEqual([
      ['keyword', 'val'],
      ['identifier', 'displayName'],
      ['operator', '='],
      ['identifier', 'user'],
      ['operator', '?.'],
      ['identifier', 'name'],
      ['operator', '?:'],
      ['literal', '"Guest"'],
    ])
  })

  it('keeps escaped symbols inside string literals out of operator matching', () => {
    const tokens = tokenizeKotlin('val text = "not a \\"!!\\" operator"')

    expect(tokens.filter((token) => token.value === '!!')).toHaveLength(0)
    expect(tokens.some((token) => token.kind === 'literal' && token.value.includes('!!'))).toBe(
      true,
    )
  })
})

describe('checker modules', () => {
  it('supports exact, normalized and unordered token checks', () => {
    expect(checkExactAnswer('answer', 'answer').passed).toBe(true)
    expect(checkNormalizedText('val x = 1 // comment', 'val x=1', { code: true }).passed).toBe(true)
    expect(checkUnorderedTokens(['String', 'val', 'name'], ['name', 'String', 'val']).passed).toBe(
      true,
    )
  })

  it('supports alternative token patterns and local identifier aliases', () => {
    const result = checkTokenSequence(
      'val title = name ?: "Guest"',
      ['val', 'displayName', '=', 'name', '?:', '"Guest"'],
      {
        aliases: {
          displayName: ['title'],
        },
      },
    )

    expect(result.passed).toBe(true)
  })

  it('supports alternative correct orders for independent Parsons lines', () => {
    const item = contentPackage.exercises.find(
      (candidate): candidate is Extract<Exercise, { kind: 'line-parsons' }> =>
        candidate.kind === 'line-parsons',
    )
    if (!item) {
      throw new Error('Missing line Parsons fixture')
    }

    const alternative = ['line.user.model', 'line.user.copy', 'line.user.value']
    expect(
      checkExerciseAnswer(item, alternative, {
        parsonsAlternativeOrders: [alternative],
      }).passed,
    ).toBe(true)
  })

  it('passes every domain exercise fixture with a representative correct answer', () => {
    const answers: Record<Exercise['kind'], unknown> = {
      'single-choice': 'option.val',
      'multiple-choice': ['option.assigned-once', 'option.read-only'],
      'true-false': { value: false, explanation: 'val protects the binding, not object state.' },
      'token-ordering': ['val', 'language', ':', 'String', '=', '"Kotlin"'],
      'micro-parsons': [
        'fragment.counter.declare',
        'fragment.counter.increment',
        'fragment.counter.print',
      ],
      'line-parsons': ['line.user.model', 'line.user.value', 'line.user.copy'],
      'fill-in-the-blanks': { operator: '?:', fallback: 'Guest' },
      'output-prediction': '2',
      'type-prediction': 'String',
      'code-debugging': 'val displayName = user.name ?: "Guest"',
      'code-writing': 'val displayName = name ?: "Guest"',
      'code-refactoring': 'val course = "Kotlin"\nvar attempts = 1\nattempts += 1',
      'concept-matching': {
        'left.val': 'right.readonly-binding',
        'left.var': 'right.mutable-binding',
      },
      'execution-tracing': ['attempts=1', 'attempts=2', 'attempts=4'],
      'scenario-based-transfer': 'displayName uses an Elvis fallback to Guest and avoids !!.',
      'project-step': 'data class Profile with displayName fallback; does not use !!',
      'self-check-question':
        'I choose var when the intent is reassignment and the value needs to change.',
    }

    for (const item of contentPackage.exercises) {
      expect(checkExerciseAnswer(item, answers[item.kind]).passed, item.kind).toBe(true)
    }
  })
})

describe('structural checker', () => {
  it('supports required and forbidden nullable access patterns', () => {
    const result = evaluateStructuralRules('val name = user?.name ?: "Guest"', [
      { kind: 'required-keyword', keyword: 'val' },
      { kind: 'nullable-access-pattern', pattern: 'safe-call' },
      { kind: 'nullable-access-pattern', pattern: 'elvis' },
      { kind: 'nullable-access-pattern', pattern: 'not-null-forbidden' },
      { kind: 'balanced-delimiters' },
    ])

    expect(result.passed).toBe(true)
  })

  it('does not produce false positives for forbidden constructs inside strings or comments', () => {
    const result = evaluateStructuralRules('val text = "!!" // ?:', [
      { kind: 'forbidden-operator', operator: '!!' },
      { kind: 'forbidden-operator', operator: '?:' },
    ])

    expect(result.passed).toBe(true)
  })

  it('checks declarations, annotations, ordered constructs and construct counts', () => {
    const result = evaluateStructuralRules('fun <T> identity(value: T): T = value', [
      { kind: 'required-declaration', declaration: 'fun', name: 'identity' },
      { kind: 'required-type-annotation', identifier: 'value', typeName: 'T' },
      { kind: 'ordered-constructs', constructs: ['fun', 'identity', 'value'] },
      { kind: 'minimum-construct-count', construct: 'T', count: 2 },
      { kind: 'maximum-construct-count', construct: 'var', count: 0 },
      { kind: 'balanced-delimiters' },
    ])

    expect(result.passed).toBe(true)
  })

  it('checks branches, exhaustive when and balanced delimiters', () => {
    const result = evaluateStructuralRules('when (status) { "ok" -> 1\nelse -> 0 }', [
      { kind: 'required-branch', branch: '"ok" -> 1' },
      { kind: 'exhaustive-when' },
      { kind: 'balanced-delimiters' },
    ])

    expect(result.passed).toBe(true)
    expect(
      evaluateStructuralRules('when (status) { "ok" -> 1 }', [{ kind: 'exhaustive-when' }])
        .errorTags,
    ).toContain('missing-else')
  })

  it('checks suspend functions, coroutine builders and Flow operator sequences', () => {
    const coroutine = evaluateStructuralRules(
      'suspend fun load() = coroutineScope { async { 1 } }',
      [
        { kind: 'required-suspend-modifier' },
        { kind: 'required-coroutine-builder', builders: ['launch', 'async'] },
      ],
    )
    const flow = evaluateStructuralRules('flow.map { it }.flatMapLatest { it }.stateIn(scope)', [
      {
        kind: 'expected-flow-operator-sequence',
        operators: ['map', 'flatMapLatest', 'stateIn'],
      },
    ])

    expect(coroutine.passed).toBe(true)
    expect(flow.passed).toBe(true)
  })

  it('reports diagnostic categories and highlighted ranges', () => {
    const tokens = tokenizeKotlin(
      'val name = user.name!!\nname = "Ada"\nGlobalScope.launch { async { 1 } }',
    )
    const diagnostics = diagnoseKotlin(
      'val name = user.name!!\nname = "Ada"\nGlobalScope.launch { async { 1 } }',
      tokens,
    )

    expect(diagnostics.tags).toEqual(
      expect.arrayContaining([
        'nullable-access',
        'reassignment-of-val',
        'coroutine-scope-leak',
        'lost-coroutine-exception',
      ]),
    )
    expect(diagnostics.ranges.length).toBeGreaterThan(0)
  })

  it('flags wrong equality and Flow collection misunderstandings', () => {
    const source = 'val same = left === right\nflow { emit(1) }.map { it + 1 }'
    const diagnostics = diagnoseKotlin(source, tokenizeKotlin(source))

    expect(diagnostics.tags).toEqual(
      expect.arrayContaining(['wrong-equality', 'flow-collection-misunderstanding']),
    )
  })
})
