<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { checkKindLabels, getDemoLesson, stateTones } from '../content/demoLearning'
import { checkDemoAnswer, type DemoCheckResult } from '../domain/checking/demoCheck'
import type { Exercise, ExerciseAttempt, ExerciseResult } from '../domain/model'
import { ExerciseRenderer, type ExerciseSubmitPayload } from '../features/exercise/components'
import { useContentStore } from '../stores/content'
import { useProgressStore } from '../stores/progress'
import { useSessionStore } from '../stores/session'
import { useSettingsStore } from '../stores/settings'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppCodeBlock from '../shared/ui/AppCodeBlock.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'
import AppSkeleton from '../shared/ui/AppSkeleton.vue'
import KotlinEditor from '../shared/ui/KotlinEditor.vue'

const props = defineProps<{
  lessonId: string
}>()

const content = useContentStore()
const progress = useProgressStore()
const session = useSessionStore()
const settings = useSettingsStore()
const currentExerciseIndex = ref(0)
const drafts = ref<Record<string, unknown>>({})
const demoAnswer = ref('')
const demoResult = ref<DemoCheckResult | null>(null)

onMounted(() => {
  void content.load()
})

const registryLessonId = computed(() =>
  props.lessonId.startsWith('lesson.') ? props.lessonId : `lesson.${props.lessonId}`,
)
const contentLesson = computed(() => content.registry?.lessons.get(registryLessonId.value) ?? null)
const contentExercises = computed(() => {
  const registry = content.registry
  const lesson = contentLesson.value
  if (!registry || !lesson) {
    return []
  }
  return lesson.exerciseIds
    .map((exerciseId) => registry.exercises.get(exerciseId))
    .filter((exercise): exercise is Exercise => exercise !== undefined)
})
const currentExercise = computed(() => contentExercises.value[currentExerciseIndex.value] ?? null)
const lessonExamples = computed(() => {
  const registry = content.registry
  const lesson = contentLesson.value
  if (!registry || !lesson) {
    return []
  }
  return lesson.exampleIds
    .map((exampleId) => registry.examples.get(exampleId))
    .filter((example) => example !== undefined)
})
const currentExplanation = computed(() => {
  const registry = content.registry
  const exercise = currentExercise.value
  if (!registry || !exercise) {
    return ''
  }
  const explanation = registry.explanations.get(exercise.explanationId)
  return explanation ? `${explanation.title}: ${explanation.body}` : ''
})
const lessonProgress = computed(() => {
  const total = contentExercises.value.length
  if (total === 0) {
    return 0
  }
  const completed = contentExercises.value.filter((exercise) =>
    progress.lessonProgress[registryLessonId.value]?.completedExerciseIds.includes(exercise.id),
  ).length
  return Math.round((completed / total) * 100)
})
const demoLesson = computed(() => getDemoLesson(props.lessonId))

watch(
  () => contentLesson.value?.id,
  () => {
    currentExerciseIndex.value = 0
  },
)

function updateDraft(answer: unknown): void {
  const exercise = currentExercise.value
  if (!exercise) {
    return
  }
  drafts.value = {
    ...drafts.value,
    [exercise.id]: answer,
  }
}

function handleExerciseSubmit(payload: ExerciseSubmitPayload): void {
  const exercise = currentExercise.value
  if (!exercise) {
    return
  }

  progress.recordAttempt(createAttempt(exercise, payload))
  if (payload.result.passed) {
    session.setActiveLesson(props.lessonId.replace(/^lesson\./, ''))
    session.recordDemoCompletion()
  }
}

function goToNextExercise(): void {
  currentExerciseIndex.value =
    contentExercises.value.length === 0
      ? 0
      : (currentExerciseIndex.value + 1) % contentExercises.value.length
}

function submitDemoAnswer(): void {
  demoResult.value = checkDemoAnswer(
    demoLesson.value.id,
    demoAnswer.value,
    demoLesson.value.checkKind,
  )
  if (demoResult.value.status === 'correct') {
    session.setActiveLesson(demoLesson.value.id)
    session.recordDemoCompletion()
  }
}

function createAttempt(exercise: Exercise, payload: ExerciseSubmitPayload): ExerciseAttempt {
  const answeredAt = new Date().toISOString()
  const result = mapCheckerResult(exercise, payload)

  return {
    id: `attempt.${exercise.id}.${Date.now()}`,
    exerciseId: exercise.id,
    lessonId: exercise.lessonId,
    answeredAt,
    usedHintIds: [...payload.usedHintIds],
    viewedSolution: payload.viewedSolution,
    answer: payload.answer,
    result,
  }
}

function mapCheckerResult(exercise: Exercise, payload: ExerciseSubmitPayload): ExerciseResult {
  const matched = payload.result.matchedRules.length
  const failed = payload.result.failedRules.length
  const total = Math.max(1, matched + failed)
  const score = payload.result.passed ? 1 : Math.min(matched / total, 0.75)
  const status: ExerciseResult['status'] = payload.result.passed
    ? 'correct'
    : matched > 0
      ? 'partially-correct'
      : 'incorrect'

  return {
    status,
    score,
    checkerKind: exercise.kind,
    matchedRules: [...payload.result.matchedRules],
    failedRules: [...payload.result.failedRules],
    feedback: payload.result.feedbackMessageKeys.join(', '),
  }
}
</script>

<template>
  <div class="space-y-6">
    <template v-if="content.loading && !contentLesson">
      <AppPageHeader
        title="Loading lesson"
        description="Preparing Kotlin exercises and checkers."
      />
      <AppSkeleton class="h-48" />
      <AppSkeleton class="h-80" />
    </template>

    <template v-else-if="contentLesson">
      <AppPageHeader
        :title="contentLesson.title"
        :description="contentLesson.summary"
        :badge="`${contentExercises.length} exercises`"
        badge-tone="new"
      />

      <section class="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(280px,0.25fr)]">
        <AppCard>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-[var(--color-text)]">Lesson context</h2>
              <p class="mt-1 text-sm text-[var(--color-text-muted)]">
                Exercise {{ currentExerciseIndex + 1 }} of {{ contentExercises.length }}.
              </p>
            </div>
            <AppProgress :value="lessonProgress" :label="`Lesson progress ${lessonProgress}%`" />
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <AppCodeBlock
              v-for="example in lessonExamples"
              :key="example.id"
              :code="example.code"
              :label="example.title"
            />
          </div>
        </AppCard>

        <AppCard tone="review">
          <h2 class="text-lg font-semibold text-[var(--color-text)]">Checker report</h2>
          <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            This client-side checker normalizes Kotlin-like code and never calls an external
            compiler.
          </p>
          <p class="mt-3 text-sm text-[var(--color-text-muted)]">
            Drafts are debounced in component state; static content is not stored in localStorage.
          </p>
        </AppCard>
      </section>

      <ExerciseRenderer
        v-if="currentExercise"
        :exercise="currentExercise"
        :draft="drafts[currentExercise.id]"
        :explanation="currentExplanation"
        @update:draft="updateDraft"
        @submit="handleExerciseSubmit"
        @next="goToNextExercise"
      />
    </template>

    <template v-else>
      <AppPageHeader
        :title="demoLesson.title"
        :description="demoLesson.summary"
        :badge="checkKindLabels[demoLesson.checkKind]"
        :badge-tone="stateTones[demoLesson.state]"
      />

      <AppAlert v-if="demoLesson.state === 'locked'" title="Lesson is locked" tone="warning">
        The route remains available for reading, but practice opens after its prerequisites.
      </AppAlert>

      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
        <AppCard>
          <h2 class="text-lg font-semibold text-[var(--color-text)]">Learning fragment</h2>
          <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            This legacy demo still uses deterministic local checking and keeps old navigation links
            alive.
          </p>
          <div class="mt-4">
            <AppCodeBlock :code="demoLesson.code" />
          </div>
        </AppCard>

        <AppCard tone="new">
          <h2 class="text-lg font-semibold text-[var(--color-text)]">Task</h2>
          <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {{ demoLesson.exercise }}
          </p>
          <div class="mt-4">
            <AppProgress
              :value="demoLesson.progress"
              :label="`Lesson progress ${demoLesson.progress}%`"
            />
          </div>
        </AppCard>
      </section>

      <AppCard>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-[var(--color-text)]">Answer</h2>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">
              Checker type: {{ checkKindLabels[demoLesson.checkKind] }}.
            </p>
          </div>
          <AppButton :disabled="demoLesson.state === 'locked'" @click="submitDemoAnswer">
            Check rules
          </AppButton>
        </div>
        <div class="mt-4">
          <KotlinEditor
            v-model="demoAnswer"
            label="Kotlin demo answer"
            :readonly="demoLesson.state === 'locked'"
            :dark="settings.resolvedTheme === 'dark'"
            @submit="submitDemoAnswer"
          />
        </div>
      </AppCard>

      <AppAlert
        v-if="demoResult"
        :title="demoResult.status === 'correct' ? 'Rules passed' : 'Check failed'"
        :tone="demoResult.status === 'correct' ? 'success' : 'warning'"
      >
        {{ demoResult.feedback }}
        <span v-if="demoResult.missing.length > 0">
          Missing: {{ demoResult.missing.join(', ') }}.
        </span>
      </AppAlert>
    </template>

    <div class="flex flex-wrap gap-2">
      <AppLinkButton to="/learn" variant="secondary">Course map</AppLinkButton>
      <AppLinkButton to="/practice" variant="secondary">Targeted practice</AppLinkButton>
    </div>
  </div>
</template>
