import type { Exercise } from '../model'
import type { CheckExerciseOptions, CheckerResult, ExerciseAnswer } from './types'
import {
  checkConceptMatching,
  checkMultipleChoice,
  checkSingleChoice,
  checkTrueFalse,
} from './checkers/choice'
import { checkDebugging } from './checkers/debugging'
import { checkFillBlanks } from './checkers/fillBlanks'
import { checkOutput } from './checkers/output'
import { checkParsons } from './checkers/parsons'
import { checkProjectStep, checkScenarioTransfer, checkSelfCheck } from './checkers/projectStep'
import { checkRefactoring } from './checkers/refactoring'
import { checkStructuralCode } from './checkers/structural'
import { checkTokenSequence } from './checkers/tokenSequence'
import { checkTrace } from './checkers/trace'
import { checkTypePrediction } from './checkers/type'

export function checkExerciseAnswer(
  exercise: Exercise,
  answer: ExerciseAnswer,
  options: CheckExerciseOptions = {},
): CheckerResult {
  switch (exercise.kind) {
    case 'single-choice':
      return checkSingleChoice(exercise, answer)
    case 'multiple-choice':
      return checkMultipleChoice(exercise, answer)
    case 'true-false':
      return checkTrueFalse(exercise, answer)
    case 'token-ordering':
      return checkTokenSequence(answer, exercise.checker.expectedTokens, {
        patterns: options.alternativeTokenPatterns,
        aliases: options.identifierAliases,
      })
    case 'micro-parsons':
      return checkParsons(
        answer,
        exercise.checker.expectedFragmentIds,
        options.parsonsAlternativeOrders,
      )
    case 'line-parsons':
      return checkParsons(
        answer,
        exercise.checker.expectedLineIds,
        options.parsonsAlternativeOrders,
      )
    case 'fill-in-the-blanks':
      return checkFillBlanks(exercise, answer)
    case 'output-prediction':
      return checkOutput(
        answer,
        exercise.checker.expectedOutput,
        exercise.checker.normalizeWhitespace,
      )
    case 'type-prediction':
      return checkTypePrediction(
        answer,
        exercise.checker.expectedType,
        exercise.checker.acceptedAliases,
      )
    case 'code-debugging':
      return checkDebugging(exercise, answer)
    case 'code-writing':
      return checkStructuralCode(exercise, answer, options)
    case 'code-refactoring':
      return checkRefactoring(exercise, answer)
    case 'concept-matching':
      return checkConceptMatching(exercise, answer)
    case 'execution-tracing':
      return checkTrace(exercise, answer)
    case 'scenario-based-transfer':
      return checkScenarioTransfer(exercise, answer)
    case 'project-step':
      return checkProjectStep(exercise, answer)
    case 'self-check-question':
      return checkSelfCheck(exercise, answer)
  }
}
