import { checkerResult } from '../result'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsRecord, answerAsStringArray, multisetsEqual } from './common'

export function checkSingleChoice(
  exercise: ExerciseWithKind<'single-choice'>,
  answer: ExerciseAnswer,
) {
  const actual = typeof answer === 'string' ? answer : ''
  const passed = actual === exercise.checker.correctOptionId

  return checkerResult({
    checker: 'choice',
    passed,
    matchedRules: passed ? [`option:${actual}`] : [],
    failedRules: passed ? [] : ['single-choice'],
  })
}

export function checkMultipleChoice(
  exercise: ExerciseWithKind<'multiple-choice'>,
  answer: ExerciseAnswer,
) {
  const actual = answerAsStringArray(answer)
  const expected = exercise.checker.correctOptionIds
  const passed = exercise.checker.requireExact
    ? multisetsEqual(actual, expected)
    : expected.every((id) => actual.includes(id))

  return checkerResult({
    checker: 'choice',
    passed,
    matchedRules: passed ? expected.map((id) => `option:${id}`) : [],
    failedRules: passed ? [] : ['multiple-choice'],
  })
}

export function checkTrueFalse(exercise: ExerciseWithKind<'true-false'>, answer: ExerciseAnswer) {
  const value = parseTrueFalse(answer)
  const explanation =
    answer && typeof answer === 'object' && 'explanation' in answer
      ? String(answer.explanation ?? '').trim()
      : ''
  const hasExplanation = !exercise.checker.explanationRequired || explanation.length >= 8
  const passed = value === exercise.checker.expected && hasExplanation

  return checkerResult({
    checker: 'choice',
    passed,
    matchedRules: passed ? ['true-false:value', 'true-false:explanation'] : [],
    failedRules: [
      ...(value === exercise.checker.expected ? [] : ['true-false:value']),
      ...(hasExplanation ? [] : ['true-false:explanation']),
    ],
  })
}

export function checkConceptMatching(
  exercise: ExerciseWithKind<'concept-matching'>,
  answer: ExerciseAnswer,
) {
  const actual = answerAsRecord(answer)
  const expectedPairs = exercise.checker.pairs
  const passed = expectedPairs.every((pair) => actual[pair.leftId] === pair.rightId)

  return checkerResult({
    checker: 'choice',
    passed,
    matchedRules: passed ? expectedPairs.map((pair) => `${pair.leftId}:${pair.rightId}`) : [],
    failedRules: passed
      ? []
      : expectedPairs
          .filter((pair) => actual[pair.leftId] !== pair.rightId)
          .map((pair) => `${pair.leftId}:${pair.rightId}`),
  })
}

function parseTrueFalse(answer: ExerciseAnswer): boolean | null {
  if (typeof answer === 'boolean') {
    return answer
  }
  if (answer && typeof answer === 'object' && 'value' in answer) {
    return typeof answer.value === 'boolean' ? answer.value : null
  }
  return null
}
