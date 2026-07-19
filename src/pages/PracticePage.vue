<script setup lang="ts">
import { ref } from 'vue'
import { checkKindLabels } from '../content/demoLearning'
import { checkDemoAnswer, type DemoCheckResult } from '../domain/checking/demoCheck'
import { useSessionStore } from '../stores/session'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppBadge from '../shared/ui/AppBadge.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'

const session = useSessionStore()
const answer = ref('')
const result = ref<DemoCheckResult | null>(null)

function checkPractice(): void {
  result.value = checkDemoAnswer(
    session.activeLesson.id,
    answer.value,
    session.activeLesson.checkKind,
  )
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Целевая практика"
      description="Фокус на одном навыке текущего урока: ответ проверяется локальными правилами, без compiler/runtime."
    />

    <AppCard>
      <AppBadge tone="new">{{ checkKindLabels[session.activeLesson.checkKind] }}</AppBadge>
      <h2 class="mt-3 text-lg font-semibold text-[var(--color-text)]">
        {{ session.activeLesson.title }}
      </h2>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">{{ session.activeLesson.exercise }}</p>
      <textarea
        v-model="answer"
        class="mt-4 min-h-36 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input)] p-3 font-mono text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        placeholder="Напишите короткое решение"
      />
      <AppButton class="mt-4" @click="checkPractice">Проверить практику</AppButton>
    </AppCard>

    <AppAlert
      v-if="result"
      :title="result.status === 'correct' ? 'Навык закреплен' : 'Еще одна попытка'"
      :tone="result.status === 'correct' ? 'success' : 'warning'"
    >
      {{ result.feedback }}
    </AppAlert>
  </div>
</template>
