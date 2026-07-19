import type { Exercise } from '../../../domain/model'

export function describeSolution(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'single-choice':
      return labelForOption(exercise.options, exercise.checker.correctOptionId)
    case 'multiple-choice':
      return exercise.checker.correctOptionIds
        .map((id) => labelForOption(exercise.options, id))
        .join(', ')
    case 'true-false':
      return exercise.checker.expected ? 'true' : 'false'
    case 'token-ordering':
      return exercise.checker.expectedTokens.join(' ')
    case 'micro-parsons':
      return exercise.checker.expectedFragmentIds
        .map((id) => labelForOption(exercise.fragments, id))
        .join('\n')
    case 'line-parsons':
      return exercise.checker.expectedLineIds
        .map((id) => labelForOption(exercise.lines, id))
        .join('\n')
    case 'fill-in-the-blanks':
      return exercise.checker.blanks
        .map((blank) => `${blank.blankId}: ${blank.acceptedAnswers[0] ?? ''}`)
        .join('\n')
    case 'output-prediction':
      return exercise.checker.expectedOutput
    case 'type-prediction':
      return exercise.checker.expectedType
    case 'code-debugging':
      return `Remove ${exercise.checker.forbiddenPatterns.join(', ')} and apply: ${exercise.checker.requiredFixes.join(', ')}`
    case 'code-writing':
      return [
        exercise.checker.expectedTokens?.join(' '),
        exercise.checker.requiredConstructs.length > 0
          ? `Required: ${exercise.checker.requiredConstructs.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    case 'code-refactoring':
      return exercise.checker.requiredChanges.join(', ')
    case 'concept-matching':
      return exercise.checker.pairs
        .map((pair) => {
          const left = labelForOption(exercise.leftItems, pair.leftId)
          const right = labelForOption(exercise.rightItems, pair.rightId)
          return `${left} -> ${right}`
        })
        .join('\n')
    case 'execution-tracing':
      return exercise.checker.expectedSteps.join('\n')
    case 'scenario-based-transfer':
      return exercise.checker.acceptedSolutionIds.join(', ')
    case 'project-step':
      return [...exercise.checker.requiredArtifacts, ...exercise.checker.acceptanceRules].join('\n')
    case 'self-check-question':
      return `At least ${exercise.checker.minLength} characters with: ${exercise.checker.requiredReflectionIds.join(', ')}`
  }
}

function labelForOption(options: readonly { id: string; label: string }[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? id
}
