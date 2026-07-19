<script setup lang="ts">
import type { ExerciseAnswer } from '../../../domain/checking'
import type { Exercise } from '../../../domain/model'
import UniversalExercise from './UniversalExercise.vue'
import type { ExerciseSubmitPayload } from './types'

defineProps<{
  exercise: Extract<Exercise, { kind: 'concept-matching' }>
  draft?: ExerciseAnswer
  explanation?: string
  readonly?: boolean
}>()

defineEmits<{
  'update:draft': [answer: ExerciseAnswer]
  submit: [payload: ExerciseSubmitPayload]
  next: []
}>()
</script>

<template>
  <UniversalExercise
    :exercise="exercise"
    :draft="draft"
    :explanation="explanation"
    :readonly="readonly"
    @update:draft="$emit('update:draft', $event)"
    @submit="$emit('submit', $event)"
    @next="$emit('next')"
  />
</template>
