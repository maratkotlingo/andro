import type { Exercise } from '../model'

export type KotlinTokenKind =
  'identifier' | 'keyword' | 'literal' | 'operator' | 'punctuation' | 'comment'

export type SourceRange = {
  from: number
  to: number
  messageKey?: string | undefined
}

export type DiagnosticTag =
  | 'nullable-access'
  | 'wrong-equality'
  | 'reassignment-of-val'
  | 'missing-else'
  | 'wrong-smart-cast-assumption'
  | 'wrong-return-scope'
  | 'mutable-read-only-collection-confusion'
  | 'wrong-lambda-receiver'
  | 'eager-lazy-collection-confusion'
  | 'coroutine-scope-leak'
  | 'missing-cancellation-propagation'
  | 'incorrect-dispatcher-usage'
  | 'lost-coroutine-exception'
  | 'flow-collection-misunderstanding'
  | 'syntax-shape'
  | 'missing-construct'
  | 'forbidden-construct'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type KotlinToken = {
  kind: KotlinTokenKind
  value: string
  from: number
  to: number
}

export type CheckerKind =
  | 'exact-answer'
  | 'normalized-text'
  | 'token-sequence'
  | 'unordered-token'
  | 'choice'
  | 'parsons'
  | 'fill-blanks'
  | 'output'
  | 'type'
  | 'structural-code'
  | 'debugging'
  | 'refactoring'
  | 'trace'
  | 'project-step'

export type CheckerResult = {
  checker: CheckerKind
  passed: boolean
  matchedRules: readonly string[]
  failedRules: readonly string[]
  errorTags: readonly DiagnosticTag[]
  feedbackMessageKeys: readonly string[]
  highlightedRanges: readonly SourceRange[]
  confidence: ConfidenceLevel
  normalizedAnswer?: string | undefined
  tokens?: readonly KotlinToken[] | undefined
}

export type IdentifierAliases = Readonly<Record<string, readonly string[]>>

export type StructuralRule =
  | { kind: 'required-keyword'; keyword: string; id?: string }
  | { kind: 'forbidden-keyword'; keyword: string; id?: string; tag?: DiagnosticTag | undefined }
  | { kind: 'required-operator'; operator: string; id?: string; tag?: DiagnosticTag | undefined }
  | { kind: 'forbidden-operator'; operator: string; id?: string; tag?: DiagnosticTag | undefined }
  | { kind: 'required-function-call'; name: string; id?: string; aliases?: readonly string[] }
  | { kind: 'forbidden-function-call'; name: string; id?: string; tag?: DiagnosticTag }
  | {
      kind: 'required-declaration'
      declaration: 'val' | 'var' | 'fun' | 'class' | 'object' | 'interface'
      name?: string
      id?: string
      aliases?: readonly string[]
    }
  | { kind: 'required-type-annotation'; identifier?: string; typeName?: string; id?: string }
  | {
      kind: 'allowed-identifier-aliases'
      canonical: string
      aliases: readonly string[]
      id?: string
    }
  | { kind: 'ordered-constructs'; constructs: readonly string[]; id?: string }
  | {
      kind: 'maximum-construct-count'
      construct: string
      count: number
      id?: string
      tag?: DiagnosticTag | undefined
    }
  | { kind: 'minimum-construct-count'; construct: string; count: number; id?: string }
  | { kind: 'balanced-delimiters'; id?: string }
  | { kind: 'required-branch'; branch: string; id?: string; tag?: DiagnosticTag | undefined }
  | { kind: 'exhaustive-when'; branches?: readonly string[]; id?: string }
  | {
      kind: 'nullable-access-pattern'
      pattern: 'safe-call' | 'elvis' | 'not-null-forbidden'
      id?: string
    }
  | { kind: 'required-suspend-modifier'; id?: string }
  | { kind: 'required-coroutine-builder'; builders: readonly string[]; id?: string }
  | { kind: 'expected-flow-operator-sequence'; operators: readonly string[]; id?: string }

export type CanonicalSolution = {
  id: string
  answer: string
}

export type TokenPattern = {
  id: string
  tokens: readonly string[]
  identifierAliases?: IdentifierAliases | undefined
}

export type StructuralConstraintSet = {
  id: string
  rules: readonly StructuralRule[]
}

export type CheckExerciseOptions = {
  canonicalSolutions?: readonly CanonicalSolution[] | undefined
  alternativeTokenPatterns?: readonly TokenPattern[] | undefined
  structuralConstraintSets?: readonly StructuralConstraintSet[] | undefined
  identifierAliases?: IdentifierAliases | undefined
  parsonsAlternativeOrders?: readonly (readonly string[])[] | undefined
}

export type ExerciseAnswer = unknown

export type ExerciseWithKind<K extends Exercise['kind']> = Extract<Exercise, { kind: K }>
