import { diagnoseKotlin } from '../diagnostics'
import { bestResult, checkerResult, confidenceFor } from '../result'
import { evaluateStructuralRules } from '../rules'
import { tokenizeKotlin } from '../tokenize'
import type {
  CheckExerciseOptions,
  ExerciseAnswer,
  ExerciseWithKind,
  StructuralRule,
} from '../types'
import { answerAsString } from './common'
import { checkTokenSequence } from './tokenSequence'

export function checkStructuralCode(
  exercise: ExerciseWithKind<'code-writing'>,
  answer: ExerciseAnswer,
  options: CheckExerciseOptions = {},
) {
  const source = answerAsString(answer)
  const rules = checkerRulesFromCodeWriting(exercise)
  const configuredSets = options.structuralConstraintSets ?? []
  const sets = [{ id: 'content-config', rules }, ...configuredSets].filter(
    (set) => set.rules.length > 0,
  )

  const results = sets.map((set) => {
    const structural = evaluateStructuralRules(source, set.rules)
    const diagnostics = diagnoseKotlin(source, structural.tokens)
    const expectedTokenResult = exercise.checker.expectedTokens
      ? checkTokenSequence(source, exercise.checker.expectedTokens, {
          patterns: options.alternativeTokenPatterns,
          aliases: options.identifierAliases,
        })
      : null
    const passed = structural.passed && (expectedTokenResult?.passed ?? true)
    const failedRules = [...structural.failedRules, ...(expectedTokenResult?.failedRules ?? [])]

    return checkerResult({
      checker: 'structural-code',
      passed,
      matchedRules: [
        `constraint-set:${set.id}`,
        ...structural.matchedRules,
        ...(expectedTokenResult?.matchedRules ?? []),
      ],
      failedRules,
      errorTags: [...structural.errorTags, ...diagnostics.tags],
      highlightedRanges: [...structural.highlightedRanges, ...diagnostics.ranges],
      confidence: confidenceFor(passed, failedRules),
      normalizedAnswer: structural.normalizedAnswer,
      tokens: structural.tokens,
    })
  })

  const best = bestResult(results)
  if (results.length > 0) {
    return best
  }

  const tokens = tokenizeKotlin(source)
  const diagnostics = diagnoseKotlin(source, tokens)
  return checkerResult({
    checker: 'structural-code',
    passed: source.trim().length > 0,
    matchedRules: source.trim().length > 0 ? ['non-empty-code'] : [],
    failedRules: source.trim().length > 0 ? [] : ['non-empty-code'],
    errorTags: diagnostics.tags,
    highlightedRanges: diagnostics.ranges,
    confidence: source.trim().length > 0 ? 'low' : 'medium',
    tokens,
  })
}

export function checkerRulesFromCodeWriting(
  exercise: ExerciseWithKind<'code-writing'>,
): readonly StructuralRule[] {
  return [
    ...exercise.checker.requiredConstructs.map(requiredConstructRule),
    ...exercise.checker.forbiddenConstructs.map(forbiddenConstructRule),
    { kind: 'balanced-delimiters' as const },
  ]
}

function requiredConstructRule(construct: string): StructuralRule {
  if (isKeyword(construct)) {
    return { kind: 'required-keyword', keyword: construct }
  }
  if (isOperator(construct)) {
    return { kind: 'required-operator', operator: construct, tag: tagForConstruct(construct) }
  }
  return { kind: 'minimum-construct-count', construct, count: 1 }
}

function forbiddenConstructRule(construct: string): StructuralRule {
  if (isKeyword(construct)) {
    return { kind: 'forbidden-keyword', keyword: construct }
  }
  if (isOperator(construct)) {
    return { kind: 'forbidden-operator', operator: construct, tag: tagForConstruct(construct) }
  }
  return { kind: 'maximum-construct-count', construct, count: 0 }
}

function isKeyword(construct: string): boolean {
  return ['val', 'var', 'fun', 'class', 'object', 'interface', 'suspend', 'when', 'else'].includes(
    construct,
  )
}

function isOperator(construct: string): boolean {
  return ['?:', '?.', '!!', '==', '===', '!==', '!=', '=', '+=', '-=', '*=', '/='].includes(
    construct,
  )
}

function tagForConstruct(construct: string) {
  if (construct === '?:' || construct === '?.' || construct === '!!') {
    return 'nullable-access' as const
  }
  if (construct === '===' || construct === '!==') {
    return 'wrong-equality' as const
  }
  return undefined
}
