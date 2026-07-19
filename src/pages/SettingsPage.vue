<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore, type ThemePreference } from '../stores/preferences'
import { useSessionStore } from '../stores/session'
import { useToastStore } from '../stores/toast'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppSelect from '../shared/ui/AppSelect.vue'
import type { SelectOption } from '../shared/ui/types'

const preferences = usePreferencesStore()
const session = useSessionStore()
const toast = useToastStore()

const themeOptions = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Темная' },
] as const satisfies readonly SelectOption[]

function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

const themeModel = computed({
  get: () => preferences.theme,
  set: (value: string) => {
    if (isThemePreference(value)) {
      preferences.setTheme(value)
    }
  },
})

function exportDemoProgress(): void {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    preferences: {
      theme: preferences.theme,
    },
    session: {
      activeLessonId: session.activeLessonId,
      completedToday: session.completedToday,
      sessionMinutes: session.sessionMinutes,
      streakDays: session.streakDays,
    },
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'andro-demo-progress.json'
  link.click()
  URL.revokeObjectURL(url)

  toast.notify({
    tone: 'success',
    title: 'Экспорт подготовлен',
    description: 'Скачан JSON с локальным демо-прогрессом.',
  })
}

async function validateImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    const parsed: unknown = JSON.parse(await file.text())
    if (typeof parsed === 'object' && parsed !== null && 'schemaVersion' in parsed) {
      toast.notify({
        tone: 'success',
        title: 'Файл распознан',
        description: 'Импорт будет применяться после добавления миграций состояния.',
      })
    } else {
      throw new Error('Нет schemaVersion')
    }
  } catch (error) {
    toast.notify({
      tone: 'error',
      title: 'Файл не подходит',
      description: error instanceof Error ? error.message : 'Не удалось прочитать JSON.',
    })
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Настройки"
      description="Настройки применяются локально и сохраняются в persisted Pinia stores."
    />

    <section class="grid gap-4 lg:grid-cols-2">
      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Интерфейс</h2>
        <div class="mt-4 max-w-sm">
          <AppSelect v-model="themeModel" label="Тема" :options="themeOptions" />
        </div>
      </AppCard>

      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Локальный прогресс</h2>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Экспорт уже скачивает versioned JSON демо-состояния. Импорт на этом этапе только
          валидирует файл, чтобы не применять данные без миграций.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppButton @click="exportDemoProgress">Экспорт JSON</AppButton>
          <label
            class="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-[var(--color-border-strong)] bg-[var(--color-panel)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-panel-raised)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
          >
            Проверить импорт
            <input type="file" accept="application/json" class="sr-only" @change="validateImport" />
          </label>
        </div>
      </AppCard>
    </section>

    <AppAlert title="Граница этапа" tone="neutral">
      Полное применение импортированного прогресса требует schema migrations из следующего
      архитектурного этапа.
    </AppAlert>
  </div>
</template>
