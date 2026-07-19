import type { CheckerResult, ExerciseAnswer } from '../../../domain/checking'

export type ExerciseSubmitPayload = {
  exerciseId: string
  answer: ExerciseAnswer
  result: CheckerResult
  usedHintIds: readonly string[]
  viewedSolution: boolean
}
