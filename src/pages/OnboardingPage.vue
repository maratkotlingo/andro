<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore, type ThemePreference } from '../stores/preferences'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppLinkButton from '../shared/ui/AppLinkButton.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppSelect from '../shared/ui/AppSelect.vue'
import type { SelectOption } from '../shared/ui/types'

const preferences = usePreferencesStore()

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
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Первоначальная настройка"
      description="Здесь задаются только локальные предпочтения. Аккаунт, облако и токены не требуются."
    />

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Режим работы</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <AppSelect v-model="themeModel" label="Тема интерфейса" :options="themeOptions" />
          <div class="rounded-lg border border-[var(--color-border)] p-4">
            <p class="text-sm font-medium text-[var(--color-text)]">Хранение</p>
            <p class="mt-1 text-sm text-[var(--color-text-muted)]">
              Прогресс сохраняется локально через Pinia PersistedState и `localStorage`.
            </p>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <AppLinkButton to="/diagnostic">Начать диагностику</AppLinkButton>
          <AppLinkButton to="/learn" variant="secondary">Открыть карту курса</AppLinkButton>
        </div>
      </AppCard>

      <AppAlert title="Без регистрации" tone="success">
        Этот этап не создает профиль на сервере. Меню пользователя в приложении управляет только
        локальными настройками.
      </AppAlert>
    </div>
  </div>
</template>
