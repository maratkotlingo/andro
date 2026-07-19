<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '../stores/session'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppProgress from '../shared/ui/AppProgress.vue'
import AppTabs from '../shared/ui/AppTabs.vue'
import type { AppTab } from '../shared/ui/types'

const session = useSessionStore()
const tab = ref('week')
const tabs = [
  { value: 'week', label: 'Неделя' },
  { value: 'skills', label: 'Навыки' },
] as const satisfies readonly AppTab[]
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Статистика"
      description="Пока отображается локальная демо-статистика с теми же persisted stores, которые будут расширяться дальше."
    />

    <section class="grid gap-4 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-[var(--color-text-muted)]">Сегодня</p>
        <p class="mt-2 text-3xl font-semibold text-[var(--color-text)]">
          {{ session.completedToday }}
        </p>
        <p class="text-sm text-[var(--color-text-muted)]">задания</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-[var(--color-text-muted)]">Серия</p>
        <p class="mt-2 text-3xl font-semibold text-[var(--color-text)]">{{ session.streakDays }}</p>
        <p class="text-sm text-[var(--color-text-muted)]">дня</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-[var(--color-text-muted)]">Курс</p>
        <p class="mt-2 text-3xl font-semibold text-[var(--color-text)]">
          {{ session.overallProgress }}%
        </p>
        <p class="text-sm text-[var(--color-text-muted)]">демо-среза</p>
      </AppCard>
    </section>

    <AppCard>
      <AppTabs v-model="tab" :tabs="tabs">
        <template #week>
          <div class="grid gap-4">
            <div>
              <div class="mb-2 flex justify-between text-sm">
                <span>Активное восстановление</span>
                <span>72%</span>
              </div>
              <AppProgress :value="72" label="Активное восстановление" />
            </div>
            <div>
              <div class="mb-2 flex justify-between text-sm">
                <span>Ответы без подсказок</span>
                <span>58%</span>
              </div>
              <AppProgress :value="58" label="Ответы без подсказок" />
            </div>
          </div>
        </template>
        <template #skills>
          <p class="text-sm leading-6 text-[var(--color-text-muted)]">
            Детальная матрица навыков будет строиться на тех же данных, что и страница графа
            навыков.
          </p>
        </template>
      </AppTabs>
    </AppCard>
  </div>
</template>
