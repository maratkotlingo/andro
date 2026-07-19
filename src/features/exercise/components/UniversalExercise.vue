<script setup lang="ts">
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Eye,
  Lightbulb,
  Plus,
  RotateCcw,
  X,
} from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Exercise } from '../../../domain/model'
import {
  checkExerciseAnswer,
  type CheckerResult,
  type ExerciseAnswer,
} from '../../../domain/checking'
import { useSettingsStore } from '../../../stores/settings'
import AppAlert from '../../../shared/ui/AppAlert.vue'
import AppBadge from '../../../shared/ui/AppBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import AppCodeBlock from '../../../shared/ui/AppCodeBlock.vue'
import AppIconButton from '../../../shared/ui/AppIconButton.vue'
import KotlinEditor from '../../../shared/ui/KotlinEditor.vue'
import type { ExerciseSubmitPayload } from './types'
import { describeSolution } from './solution'

const props = defineProps<{
  exercise: Exercise
  draft?: ExerciseAnswer | undefined
  explanation?: string | undefined
  readonly?: boolean | undefined
}>()

const emit = defineEmits<{
  'update:draft': [answer: ExerciseAnswer]
  submit: [payload: ExerciseSubmitPayload]
  next: []
}>()

const settings = useSettingsStore()
const answer = ref<ExerciseAnswer>(props.draft ?? defaultAnswer(props.exercise))
const result = ref<CheckerResult | null>(null)
const shownHintCount = ref(0)
const solutionVisible = ref(false)
let draftTimer: ReturnType<typeof window.setTimeout> | null = null

const checkerLabel = computed(() => props.exercise.checker.kind.replaceAll('-', ' '))
const visibleHints = computed(() => props.exercise.hints.slice(0, shownHintCount.value))
const usedHintIds = computed(() => visibleHints.value.map((hint) => hint.id))
const solutionText = computed(() => describeSolution(props.exercise))
const textAnswer = computed({
  get: () => (typeof answer.value === 'string' ? answer.value : ''),
  set: (value: string) => {
    answer.value = value
  },
})
const selectedOrderIds = computed(() => stringArray(answer.value))
const orderItems = computed(() => {
  if (props.exercise.kind === 'token-ordering') {
    return props.exercise.tokens.map((token) => ({ id: token, label: token }))
  }
  if (props.exercise.kind === 'micro-parsons') {
    return props.exercise.fragments
  }
  if (props.exercise.kind === 'line-parsons') {
    return props.exercise.lines
  }
  return []
})
const availableOrderItems = computed(() =>
  orderItems.value.filter((item) => !selectedOrderIds.value.includes(item.id)),
)
const traceSteps = computed(() => {
  if (props.exercise.kind !== 'execution-tracing') {
    return []
  }
  const values = stringArray(answer.value)
  return props.exercise.checkpoints.map((_, index) => values[index] ?? '')
})
const resultTitle = computed(() => {
  if (!result.value) {
    return ''
  }
  return result.value.passed ? 'Check passed' : 'Check needs another pass'
})
const resultTone = computed(() => (result.value?.passed ? 'success' : 'warning'))
const feedbackText = computed(() => {
  if (!result.value) {
    return ''
  }
  if (result.value.passed) {
    return 'The answer matches the configured rules.'
  }
  const tags = result.value.errorTags.join(', ')
  const failed = result.value.failedRules.join(', ')
  return [tags ? `Signals: ${tags}.` : '', failed ? `Missing or failed: ${failed}.` : '']
    .filter(Boolean)
    .join(' ')
})

watch(
  () => props.exercise.id,
  () => {
    answer.value = props.draft ?? defaultAnswer(props.exercise)
    result.value = null
    shownHintCount.value = 0
    solutionVisible.value = false
  },
)

watch(
  () => props.draft,
  (draft) => {
    if (draft !== undefined) {
      answer.value = draft
    }
  },
)

watch(
  answer,
  (value) => {
    if (draftTimer) {
      window.clearTimeout(draftTimer)
    }
    draftTimer = window.setTimeout(() => {
      emit('update:draft', value)
    }, 250)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (draftTimer) {
    window.clearTimeout(draftTimer)
  }
})

function submitAnswer(): void {
  if (props.readonly) {
    return
  }
  const checked = checkExerciseAnswer(props.exercise, answer.value)
  result.value = checked
  emit('submit', {
    exerciseId: props.exercise.id,
    answer: answer.value,
    result: checked,
    usedHintIds: usedHintIds.value,
    viewedSolution: solutionVisible.value,
  })
}

function retryAnswer(): void {
  answer.value = defaultAnswer(props.exercise)
  result.value = null
  solutionVisible.value = false
}

function showNextHint(): void {
  shownHintCount.value = Math.min(props.exercise.hints.length, shownHintCount.value + 1)
}

function revealSolution(): void {
  solutionVisible.value = true
}

function checkedSingle(optionId: string): boolean {
  return answer.value === optionId
}

function setSingle(optionId: string): void {
  answer.value = optionId
}

function checkedMultiple(optionId: string): boolean {
  return stringArray(answer.value).includes(optionId)
}

function toggleMultiple(optionId: string): void {
  const current = stringArray(answer.value)
  answer.value = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId]
}

function trueFalseValue(): boolean | null {
  const current = objectRecord(answer.value)
  return typeof current.value === 'boolean' ? current.value : null
}

function setTrueFalse(value: boolean): void {
  const current = objectRecord(answer.value)
  answer.value = {
    value,
    explanation: typeof current.explanation === 'string' ? current.explanation : '',
  }
}

function trueFalseExplanation(): string {
  const current = objectRecord(answer.value)
  return typeof current.explanation === 'string' ? current.explanation : ''
}

function setTrueFalseExplanation(value: string): void {
  const current = objectRecord(answer.value)
  answer.value = {
    value: typeof current.value === 'boolean' ? current.value : null,
    explanation: value,
  }
}

function blankValue(blankId: string): string {
  const current = objectRecord(answer.value)
  return typeof current[blankId] === 'string' ? current[blankId] : ''
}

function setBlankValue(blankId: string, value: string): void {
  answer.value = {
    ...objectRecord(answer.value),
    [blankId]: value,
  }
}

function matchValue(leftId: string): string {
  const current = objectRecord(answer.value)
  return typeof current[leftId] === 'string' ? current[leftId] : ''
}

function setMatchValue(leftId: string, rightId: string): void {
  answer.value = {
    ...objectRecord(answer.value),
    [leftId]: rightId,
  }
}

function addOrderedItem(id: string): void {
  if (selectedOrderIds.value.includes(id)) {
    return
  }
  answer.value = [...selectedOrderIds.value, id]
}

function removeOrderedItem(id: string): void {
  answer.value = selectedOrderIds.value.filter((item) => item !== id)
}

function moveOrderedItem(index: number, delta: number): void {
  const next = [...selectedOrderIds.value]
  const target = index + delta
  if (target < 0 || target >= next.length) {
    return
  }
  const current = next[index]
  const targetValue = next[target]
  if (current === undefined || targetValue === undefined) {
    return
  }
  next[index] = targetValue
  next[target] = current
  answer.value = next
}

function orderLabel(id: string): string {
  return orderItems.value.find((item) => item.id === id)?.label ?? id
}

function setTraceStep(index: number, value: string): void {
  const next = [...traceSteps.value]
  next[index] = value
  answer.value = next
}

function defaultAnswer(exercise: Exercise): ExerciseAnswer {
  switch (exercise.kind) {
    case 'single-choice':
      return ''
    case 'multiple-choice':
    case 'token-ordering':
    case 'micro-parsons':
    case 'line-parsons':
      return []
    case 'true-false':
      return { value: null, explanation: '' }
    case 'fill-in-the-blanks':
      return Object.fromEntries(exercise.checker.blanks.map((blank) => [blank.blankId, '']))
    case 'concept-matching':
      return Object.fromEntries(exercise.leftItems.map((item) => [item.id, '']))
    case 'execution-tracing':
      return exercise.checkpoints.map(() => '')
    case 'code-debugging':
      return exercise.brokenCode
    case 'code-writing':
      return exercise.starterCode
    case 'code-refactoring':
      return exercise.originalCode
    case 'output-prediction':
    case 'type-prediction':
    case 'scenario-based-transfer':
    case 'project-step':
    case 'self-check-question':
      return ''
  }
}

function stringArray(value: ExerciseAnswer): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function objectRecord(value: ExerciseAnswer): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as Readonly<Record<string, unknown>>
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submitAnswer">
    <AppCard>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold text-[var(--color-text)]">{{ exercise.title }}</h2>
            <AppBadge tone="neutral">{{ checkerLabel }}</AppBadge>
          </div>
          <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{{ exercise.prompt }}</p>
        </div>
        <AppBadge :tone="exercise.difficulty >= 4 ? 'review' : 'new'">
          {{ exercise.estimatedSeconds }}s
        </AppBadge>
      </div>
    </AppCard>

    <AppCard>
      <fieldset v-if="exercise.kind === 'single-choice'" class="space-y-2" :disabled="readonly">
        <legend class="sr-only">{{ exercise.title }}</legend>
        <label
          v-for="option in exercise.options"
          :key="option.id"
          class="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm text-[var(--color-text)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
        >
          <input
            type="radio"
            class="mt-1"
            name="single-choice"
            :checked="checkedSingle(option.id)"
            @change="setSingle(option.id)"
          />
          <span>{{ option.label }}</span>
        </label>
      </fieldset>

      <fieldset
        v-else-if="exercise.kind === 'multiple-choice'"
        class="space-y-2"
        :disabled="readonly"
      >
        <legend class="sr-only">{{ exercise.title }}</legend>
        <label
          v-for="option in exercise.options"
          :key="option.id"
          class="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm text-[var(--color-text)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
        >
          <input
            type="checkbox"
            class="mt-1"
            :checked="checkedMultiple(option.id)"
            @change="toggleMultiple(option.id)"
          />
          <span>{{ option.label }}</span>
        </label>
      </fieldset>

      <fieldset v-else-if="exercise.kind === 'true-false'" class="space-y-4" :disabled="readonly">
        <legend class="sr-only">{{ exercise.title }}</legend>
        <p
          class="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-raised)] p-3 text-sm text-[var(--color-text)]"
        >
          {{ exercise.statement }}
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm text-[var(--color-text)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
          >
            <input
              type="radio"
              name="true-false"
              :checked="trueFalseValue() === true"
              @change="setTrueFalse(true)"
            />
            <span>true</span>
          </label>
          <label
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] p-3 text-sm text-[var(--color-text)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
          >
            <input
              type="radio"
              name="true-false"
              :checked="trueFalseValue() === false"
              @change="setTrueFalse(false)"
            />
            <span>false</span>
          </label>
        </div>
        <label class="block text-sm font-medium text-[var(--color-text)]">
          Explanation
          <textarea
            class="mt-2 min-h-24 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            :value="trueFalseExplanation()"
            @input="setTrueFalseExplanation(($event.target as HTMLTextAreaElement).value)"
          />
        </label>
      </fieldset>

      <div
        v-else-if="
          exercise.kind === 'token-ordering' ||
          exercise.kind === 'micro-parsons' ||
          exercise.kind === 'line-parsons'
        "
        class="grid gap-4 lg:grid-cols-2"
      >
        <section class="space-y-2" aria-labelledby="available-items-title">
          <h3 id="available-items-title" class="text-sm font-semibold text-[var(--color-text)]">
            Available
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in availableOrderItems"
              :key="item.id"
              type="button"
              class="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-left font-mono text-sm text-[var(--color-text)] hover:bg-[var(--color-panel-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              :disabled="readonly"
              @click="addOrderedItem(item.id)"
            >
              <Plus class="size-4" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </button>
          </div>
        </section>
        <section class="space-y-2" aria-labelledby="selected-items-title">
          <h3 id="selected-items-title" class="text-sm font-semibold text-[var(--color-text)]">
            Answer
          </h3>
          <ol class="space-y-2">
            <li
              v-for="(id, index) in selectedOrderIds"
              :key="id"
              class="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-raised)] p-2 text-sm text-[var(--color-text)]"
            >
              <span class="min-w-6 text-center text-xs text-[var(--color-text-subtle)]">
                {{ index + 1 }}
              </span>
              <span class="min-w-0 flex-1 font-mono">{{ orderLabel(id) }}</span>
              <AppIconButton
                label="Move up"
                size="sm"
                :disabled="readonly || index === 0"
                @click="moveOrderedItem(index, -1)"
              >
                <ArrowUp class="size-4" aria-hidden="true" />
              </AppIconButton>
              <AppIconButton
                label="Move down"
                size="sm"
                :disabled="readonly || index === selectedOrderIds.length - 1"
                @click="moveOrderedItem(index, 1)"
              >
                <ArrowDown class="size-4" aria-hidden="true" />
              </AppIconButton>
              <AppIconButton
                label="Remove"
                size="sm"
                :disabled="readonly"
                @click="removeOrderedItem(id)"
              >
                <X class="size-4" aria-hidden="true" />
              </AppIconButton>
            </li>
          </ol>
        </section>
      </div>

      <div v-else-if="exercise.kind === 'fill-in-the-blanks'" class="space-y-4">
        <pre
          class="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-raised)] p-3 text-sm text-[var(--color-text)]"
        ><code>{{ exercise.template }}</code></pre>
        <div class="grid gap-3 sm:grid-cols-2">
          <label
            v-for="blank in exercise.checker.blanks"
            :key="blank.blankId"
            class="block text-sm font-medium text-[var(--color-text)]"
          >
            {{ blank.blankId }}
            <input
              class="mt-2 h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              :disabled="readonly"
              :value="blankValue(blank.blankId)"
              @input="setBlankValue(blank.blankId, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>

      <div v-else-if="exercise.kind === 'output-prediction'" class="space-y-4">
        <AppCodeBlock :code="exercise.code" />
        <label class="block text-sm font-medium text-[var(--color-text)]">
          Output
          <textarea
            v-model="textAnswer"
            class="mt-2 min-h-24 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 font-mono text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            :disabled="readonly"
          />
        </label>
      </div>

      <div v-else-if="exercise.kind === 'type-prediction'" class="space-y-4">
        <AppCodeBlock :code="exercise.expression" />
        <label class="block text-sm font-medium text-[var(--color-text)]">
          Type
          <input
            v-model="textAnswer"
            class="mt-2 h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 font-mono text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            :disabled="readonly"
          />
        </label>
      </div>

      <div
        v-else-if="
          exercise.kind === 'code-debugging' ||
          exercise.kind === 'code-writing' ||
          exercise.kind === 'code-refactoring'
        "
        class="space-y-4"
      >
        <div v-if="exercise.kind === 'code-debugging'">
          <p class="mb-2 text-sm font-semibold text-[var(--color-text)]">Broken code</p>
          <KotlinEditor
            :model-value="exercise.brokenCode"
            label="Broken Kotlin code"
            readonly
            :dark="settings.resolvedTheme === 'dark'"
            min-height="7rem"
          />
        </div>
        <div v-else-if="exercise.kind === 'code-refactoring'">
          <p class="mb-2 text-sm font-semibold text-[var(--color-text)]">Original code</p>
          <KotlinEditor
            :model-value="exercise.originalCode"
            label="Original Kotlin code"
            readonly
            :dark="settings.resolvedTheme === 'dark'"
            min-height="7rem"
          />
        </div>
        <KotlinEditor
          v-model="textAnswer"
          label="Kotlin answer"
          :readonly="readonly"
          :dark="settings.resolvedTheme === 'dark'"
          :error-ranges="result?.highlightedRanges ?? []"
          @submit="submitAnswer"
          @retry="retryAnswer"
        />
      </div>

      <div v-else-if="exercise.kind === 'concept-matching'" class="space-y-3">
        <label
          v-for="left in exercise.leftItems"
          :key="left.id"
          class="grid gap-2 text-sm font-medium text-[var(--color-text)] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] sm:items-center"
        >
          <span>{{ left.label }}</span>
          <select
            class="h-10 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            :disabled="readonly"
            :value="matchValue(left.id)"
            @change="setMatchValue(left.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Select</option>
            <option v-for="right in exercise.rightItems" :key="right.id" :value="right.id">
              {{ right.label }}
            </option>
          </select>
        </label>
      </div>

      <div v-else-if="exercise.kind === 'execution-tracing'" class="space-y-4">
        <AppCodeBlock :code="exercise.code" />
        <div class="space-y-3">
          <label
            v-for="(checkpoint, index) in exercise.checkpoints"
            :key="checkpoint"
            class="block text-sm font-medium text-[var(--color-text)]"
          >
            {{ checkpoint }}
            <input
              class="mt-2 h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 font-mono text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              :disabled="readonly"
              :value="traceSteps[index]"
              @input="setTraceStep(index, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>

      <label v-else class="block text-sm font-medium text-[var(--color-text)]">
        <span v-if="exercise.kind === 'scenario-based-transfer'">{{ exercise.scenario }}</span>
        <span v-else-if="exercise.kind === 'project-step'">{{ exercise.projectContext }}</span>
        <span v-else-if="exercise.kind === 'self-check-question'">{{ exercise.question }}</span>
        <textarea
          v-model="textAnswer"
          class="mt-3 min-h-36 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 text-sm leading-6 text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          :disabled="readonly"
        />
      </label>
    </AppCard>

    <AppAlert v-if="visibleHints.length > 0" title="Hint" tone="review">
      <ol class="space-y-1">
        <li v-for="hint in visibleHints" :key="hint.id">Level {{ hint.level }}: {{ hint.body }}</li>
      </ol>
    </AppAlert>

    <AppAlert v-if="solutionVisible" title="Solution" tone="warning">
      <pre class="whitespace-pre-wrap font-mono text-sm">{{ solutionText }}</pre>
    </AppAlert>

    <AppAlert v-if="explanation" title="Explanation" tone="neutral">
      {{ explanation }}
    </AppAlert>

    <AppAlert v-if="result" :title="resultTitle" :tone="resultTone">
      <div class="space-y-2">
        <p>{{ feedbackText }}</p>
        <dl class="grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt class="font-semibold text-[var(--color-text)]">Confidence</dt>
            <dd>{{ result.confidence }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--color-text)]">Matched</dt>
            <dd>{{ result.matchedRules.length }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--color-text)]">Failed</dt>
            <dd>{{ result.failedRules.length }}</dd>
          </div>
        </dl>
      </div>
    </AppAlert>

    <div class="flex flex-wrap items-center gap-2">
      <AppButton type="submit" :disabled="readonly">
        <CheckCircle2 class="size-4" aria-hidden="true" />
        Submit
      </AppButton>
      <AppButton variant="secondary" :disabled="readonly" @click="retryAnswer">
        <RotateCcw class="size-4" aria-hidden="true" />
        Retry
      </AppButton>
      <AppButton
        variant="secondary"
        :disabled="shownHintCount >= exercise.hints.length"
        @click="showNextHint"
      >
        <Lightbulb class="size-4" aria-hidden="true" />
        Hint
      </AppButton>
      <AppButton variant="secondary" @click="revealSolution">
        <Eye class="size-4" aria-hidden="true" />
        Solution
      </AppButton>
      <AppButton variant="ghost" @click="emit('next')">
        Next
        <ArrowRight class="size-4" aria-hidden="true" />
      </AppButton>
    </div>
  </form>
</template>
