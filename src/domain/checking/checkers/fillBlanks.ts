import { checkerResult } from '../result'
import type { ExerciseAnswer, ExerciseWithKind } from '../types'
import { answerAsRecord } from './common'

export function checkFillBlanks(
  exercise: ExerciseWithKind<'fill-in-the-blanks'>,
  answer: ExerciseAnswer,
) {
  const actual = answerAsRecord(answer)
  const failedRules: string[] = []
  const matchedRules: string[] = []

  for (const blank of exercise.checker.blanks) {
    const actualValue = actual[blank.blankId] ?? ''
    const comparableActual = blank.caseSensitive
      ? actualValue.trim()
      : actualValue.trim().toLocaleLowerCase()
    const matched = blank.acceptedAnswers.some((accepted) => {
      const comparableAccepted = blank.caseSensitive
        ? accepted.trim()
        : accepted.trim().toLocaleLowerCase()
      return comparableActual === comparableAccepted
    })

    if (matched) {
      matchedRules.push(`blank:${blank.blankId}`)
    } else {
      failedRules.push(`blank:${blank.blankId}`)
    }
  }

  return checkerResult({
    checker: 'fill-blanks',
    passed: failedRules.length === 0,
    matchedRules,
    failedRules,
  })
}
