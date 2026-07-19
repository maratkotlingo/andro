<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { Exercise } from '../../../domain/model'
import type { ExerciseAnswer } from '../../../domain/checking'
import CodeDebuggingExercise from './CodeDebuggingExercise.vue'
import CodeRefactoringExercise from './CodeRefactoringExercise.vue'
import CodeWritingExercise from './CodeWritingExercise.vue'
import ConceptMatchingExercise from './ConceptMatchingExercise.vue'
import ExecutionTracingExercise from './ExecutionTracingExercise.vue'
import FillBlanksExercise from './FillBlanksExercise.vue'
import LineParsonsExercise from './LineParsonsExercise.vue'
import MicroParsonsExercise from './MicroParsonsExercise.vue'
import MultipleChoiceExercise from './MultipleChoiceExercise.vue'
import OutputPredictionExercise from './OutputPredictionExercise.vue'
import ProjectStepExercise from './ProjectStepExercise.vue'
import ScenarioTransferExercise from './ScenarioTransferExercise.vue'
import SelfCheckQuestionExercise from './SelfCheckQuestionExercise.vue'
import SingleChoiceExercise from './SingleChoiceExercise.vue'
import TokenOrderingExercise from './TokenOrderingExercise.vue'
import TrueFalseExercise from './TrueFalseExercise.vue'
import TypePredictionExercise from './TypePredictionExercise.vue'
import type { ExerciseSubmitPayload } from './types'

const props = defineProps<{
  exercise: Exercise
  draft?: ExerciseAnswer | undefined
  explanation?: string | undefined
  readonly?: boolean | undefined
}>()

defineEmits<{
  'update:draft': [answer: ExerciseAnswer]
  submit: [payload: ExerciseSubmitPayload]
  next: []
}>()

const renderers: Record<Exercise['kind'], Component> = {
  'single-choice': SingleChoiceExercise,
  'multiple-choice': MultipleChoiceExercise,
  'true-false': TrueFalseExercise,
  'token-ordering': TokenOrderingExercise,
  'micro-parsons': MicroParsonsExercise,
  'line-parsons': LineParsonsExercise,
  'fill-in-the-blanks': FillBlanksExercise,
  'output-prediction': OutputPredictionExercise,
  'type-prediction': TypePredictionExercise,
  'code-debugging': CodeDebuggingExercise,
  'code-writing': CodeWritingExercise,
  'code-refactoring': CodeRefactoringExercise,
  'concept-matching': ConceptMatchingExercise,
  'execution-tracing': ExecutionTracingExercise,
  'scenario-based-transfer': ScenarioTransferExercise,
  'project-step': ProjectStepExercise,
  'self-check-question': SelfCheckQuestionExercise,
}

const component = computed(() => renderers[props.exercise.kind])
</script>

<template>
  <component
    :is="component"
    :exercise="exercise"
    :draft="draft"
    :explanation="explanation"
    :readonly="readonly"
    @update:draft="$emit('update:draft', $event)"
    @submit="$emit('submit', $event)"
    @next="$emit('next')"
  />
</template>
