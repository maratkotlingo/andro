<script setup lang="ts">
import { computed, ref } from 'vue'
import { checkKindLabels, getDemoLesson, stateTones } from '../content/demoLearning'
import { checkDemoAnswer, type DemoCheckResult } from '../domain/checking/demoCheck'
import { useSessionStore } from '../stores/session'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppCodeBlock from '../shared/ui/AppCodeBlock.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'

const props = defineProps<{
  lessonId: string
}>()

const session = useSessionStore()
const answer = ref('')
const result = ref<DemoCheckResult | null>(null)
const lesson = computed(() => getDemoLesson(props.lessonId))

function submitAnswer(): void {
  result.value = checkDemoAnswer(lesson.value.id, answer.value, lesson.value.checkKind)
  if (result.value.status === 'correct') {
    session.setActiveLesson(lesson.value.id)
    session.recordDemoCompletion()
  }
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      :title="lesson.title"
      :description="lesson.summary"
      :badge="checkKindLabels[lesson.checkKind]"
      :badge-tone="stateTones[lesson.state]"
    />

    <AppAlert v-if="lesson.state === 'locked'" title="Раздел пока закрыт" tone="warning">
      Карта курса показывает этот урок, но практику Flow нужно открыть через prerequisites. Фрагмент
      доступен только для просмотра.
    </AppAlert>

    <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Учебный фрагмент</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Это вертикальный демонстрационный срез. Проверка ниже не запускает Kotlin, а применяет
          ограниченные правила для указанного типа задания.
        </p>
        <div class="mt-4">
          <AppCodeBlock :code="lesson.code" />
        </div>
      </AppCard>

      <AppCard tone="new">
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Задание</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{{ lesson.exercise }}</p>
        <div class="mt-4">
          <AppProgress :value="lesson.progress" :label="`Прогресс урока ${lesson.progress}%`" />
        </div>
      </AppCard>
    </section>

    <AppCard>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-[var(--color-text)]">Ответ</h2>
          <p class="mt-1 text-sm text-[var(--color-text-muted)]">
            Тип проверки: {{ checkKindLabels[lesson.checkKind] }}.
          </p>
        </div>
        <AppButton :disabled="lesson.state === 'locked'" @click="submitAnswer"
          >Проверить правила</AppButton
        >
      </div>
      <textarea
        v-model="answer"
        :disabled="lesson.state === 'locked'"
        class="mt-4 min-h-36 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 font-mono text-sm text-[var(--color-text)] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        placeholder="Введите Kotlin-фрагмент для детерминированной проверки"
      />
    </AppCard>

    <AppAlert
      v-if="result"
      :title="result.status === 'correct' ? 'Правила выполнены' : 'Проверка не пройдена'"
      :tone="result.status === 'correct' ? 'success' : 'warning'"
    >
      {{ result.feedback }}
      <span v-if="result.missing.length > 0"> Не хватает: {{ result.missing.join(', ') }}.</span>
    </AppAlert>

    <div class="flex flex-wrap gap-2">
      <AppLinkButton to="/learn" variant="secondary">Вернуться к карте</AppLinkButton>
      <AppLinkButton to="/practice" variant="secondary">Целевая практика</AppLinkButton>
    </div>
  </div>
</template>
