<script setup lang="ts">
import { ref } from 'vue'
import { diagnosticQuestions, checkKindLabels } from '../content/demoLearning'
import { checkDemoAnswer, type DemoCheckResult } from '../domain/checking/demoCheck'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'

const answers = ref<Record<string, string>>({})
const result = ref<DemoCheckResult | null>(null)

function runCheck(questionId: string): void {
  const question = diagnosticQuestions.find((item) => item.id === questionId)
  if (!question) {
    return
  }

  result.value = checkDemoAnswer(question.id, answers.value[question.id] ?? '', question.checkKind)
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Входная диагностика"
      description="Три локальных задания показывают, как приложение будет определять стартовый уровень без внешнего сервиса выполнения Kotlin."
      badge="детерминированно"
      badge-tone="new"
    />

    <section class="grid gap-4">
      <AppCard v-for="question in diagnosticQuestions" :key="question.id">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <AppBadge tone="neutral">{{ checkKindLabels[question.checkKind] }}</AppBadge>
            <h2 class="mt-3 text-lg font-semibold text-[var(--color-text)]">
              {{ question.title }}
            </h2>
            <p class="mt-2 text-sm text-[var(--color-text-muted)]">{{ question.prompt }}</p>
          </div>
          <AppButton variant="secondary" @click="runCheck(question.id)">Проверить</AppButton>
        </div>
        <textarea
          v-model="answers[question.id]"
          class="mt-4 min-h-24 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 font-mono text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          placeholder="Введите короткий Kotlin-фрагмент"
        />
      </AppCard>
    </section>

    <AppAlert
      v-if="result"
      :title="result.status === 'correct' ? 'Ответ принят' : 'Нужно доработать'"
      :tone="result.status === 'correct' ? 'success' : 'warning'"
    >
      {{ result.feedback }}
      <span v-if="result.missing.length > 0"> Не хватает: {{ result.missing.join(', ') }}.</span>
    </AppAlert>
  </div>
</template>
