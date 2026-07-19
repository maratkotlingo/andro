<script setup lang="ts">
import { ref } from 'vue'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppTabs from '../shared/ui/AppTabs.vue'
import type { AppTab } from '../shared/ui/types'

const tab = ref('method')
const tabs = [
  { value: 'method', label: 'Метод' },
  { value: 'checks', label: 'Проверки' },
  { value: 'privacy', label: 'Локальность' },
] as const satisfies readonly AppTab[]
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Методология"
      description="Тренажер строится вокруг активного восстановления, исправления ошибок, переноса знания и интервального повторения."
    />

    <AppCard>
      <AppTabs v-model="tab" :tabs="tabs">
        <template #method>
          <p class="text-sm leading-6 text-[var(--color-text-muted)]">
            Тема не считается освоенной после чтения. Пользователь проходит короткое объяснение,
            разобранный пример, сборку кода, пропуски, ответ без подсказки, исправление ошибки и
            transfer-задание.
          </p>
        </template>
        <template #checks>
          <p class="text-sm leading-6 text-[var(--color-text-muted)]">
            Kotlin не выполняется. Приложение честно использует exact, normalized, token,
            structural, construct-rule, known-solution и bounded-result проверки.
          </p>
        </template>
        <template #privacy>
          <p class="text-sm leading-6 text-[var(--color-text-muted)]">
            Состояние хранится в браузере. Нет аккаунта, backend, облачной синхронизации, платных
            API и токенов.
          </p>
        </template>
      </AppTabs>
    </AppCard>

    <AppAlert title="Профессиональный режим" tone="success">
      Визуальный слой намеренно спокойный: фокус на чтении кода, заметных состояниях ошибок и
      быстром продолжении работы.
    </AppAlert>
  </div>
</template>
