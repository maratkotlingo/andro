<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore, type ThemePreference } from '../stores/settings'
import { useUiStore } from '../stores/ui'
import AppAlert from '../shared/ui/AppAlert.vue'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppDialog from '../shared/ui/AppDialog.vue'
import AppPageHeader from '../shared/ui/AppPageHeader.vue'
import AppSelect from '../shared/ui/AppSelect.vue'
import type { SelectOption } from '../shared/ui/types'

const settings = useSettingsStore()
const progress = useProgressStore()
const ui = useUiStore()
const importJson = ref('')
const importDialogOpen = ref(false)

const themeOptions = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Темная' },
] as const satisfies readonly SelectOption[]

function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

const themeModel = computed({
  get: () => settings.theme,
  set: (value: string) => {
    if (isThemePreference(value)) {
      settings.setTheme(value)
    }
  },
})

const importPreview = computed(() => ui.pendingImportPreview)
const attemptCount = computed(() => progress.attemptCount)
const backupHint = computed(() =>
  progress.lastBackupKey ? `Последняя резервная копия: ${progress.lastBackupKey}` : '',
)

function updateCodeFontSize(event: Event): void {
  const input = event.target as HTMLInputElement
  settings.setCodeFontSize(Number(input.value))
}

function exportProgress(): void {
  const blob = new Blob([progress.exportProgress(settings.snapshot)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'andro-progress.json'
  link.click()
  URL.revokeObjectURL(url)

  ui.notify({
    tone: 'success',
    title: 'Экспорт подготовлен',
    description: 'Скачан JSON только с пользовательским состоянием, без учебного контента.',
  })
}

async function previewImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    importJson.value = await file.text()
    const preview = progress.previewImport(importJson.value)
    ui.setImportPreview(preview)

    if (preview.valid) {
      importDialogOpen.value = true
      ui.notify({
        tone: 'success',
        title: 'Файл проверен',
        description: 'Импорт готов к применению после подтверждения перезаписи.',
      })
    } else {
      ui.notify({
        tone: 'error',
        title: 'Файл не подходит',
        description: preview.issues[0] ?? preview.summary,
      })
    }
  } catch (error) {
    ui.notify({
      tone: 'error',
      title: 'Файл не подходит',
      description: error instanceof Error ? error.message : 'Не удалось прочитать JSON.',
    })
  } finally {
    input.value = ''
  }
}

function confirmImport(): void {
  const applied = progress.importProgress(importJson.value, true)
  importDialogOpen.value = false

  ui.notify({
    tone: applied ? 'success' : 'error',
    title: applied ? 'Импорт применен' : 'Импорт остановлен',
    description: applied
      ? 'Перед перезаписью автоматически создана резервная копия текущего состояния.'
      : (progress.lastImportPreview?.issues[0] ?? 'Файл не прошел повторную проверку.'),
  })

  if (applied) {
    ui.setImportPreview(null)
    importJson.value = ''
  }
}

function clearPersonalAnswers(): void {
  progress.clearPersonalAnswers()
  ui.notify({
    tone: 'success',
    title: 'Ответы очищены',
    description: 'История попыток удалена, прогресс уроков и расписание повторений сохранены.',
  })
}

function resetProgress(): void {
  progress.resetProgress()
  ui.notify({
    tone: 'warning',
    title: 'Прогресс сброшен',
    description: 'Локальный прогресс возвращен к начальному состоянию.',
  })
}

function fullReset(): void {
  progress.fullReset()
  settings.resetSettings()
  ui.setImportPreview(null)
  ui.notify({
    tone: 'warning',
    title: 'Полный сброс выполнен',
    description: 'Настройки, прогресс и резервные копии очищены локально.',
  })
}
</script>

<template>
  <div class="space-y-6">
    <AppPageHeader
      title="Настройки"
      description="Настройки и прогресс остаются на устройстве, валидируются схемами и могут переноситься JSON-файлом."
    />

    <section class="grid gap-4 lg:grid-cols-2">
      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Интерфейс</h2>
        <div class="mt-4 grid max-w-sm gap-4">
          <AppSelect v-model="themeModel" label="Тема" :options="themeOptions" />
          <label class="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            Размер Kotlin-кода
            <input
              class="h-10 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-text)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-focus)]"
              type="number"
              min="12"
              max="22"
              :value="settings.codeFontSize"
              @input="updateCodeFontSize"
            />
          </label>
        </div>
      </AppCard>

      <AppCard>
        <h2 class="text-lg font-semibold text-[var(--color-text)]">Локальный прогресс</h2>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Экспорт включает schemaVersion, contentVersion и checksum. Импорт сначала показывает
          предварительную проверку, а перед перезаписью создает резервную копию.
        </p>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-[var(--color-text-muted)]">Схема</dt>
            <dd class="font-semibold text-[var(--color-text)]">v{{ progress.schemaVersion }}</dd>
          </div>
          <div>
            <dt class="text-[var(--color-text-muted)]">Контент</dt>
            <dd class="font-semibold text-[var(--color-text)]">{{ progress.contentVersion }}</dd>
          </div>
          <div>
            <dt class="text-[var(--color-text-muted)]">Попытки</dt>
            <dd class="font-semibold text-[var(--color-text)]">{{ attemptCount }}</dd>
          </div>
        </dl>
        <div class="mt-4 flex flex-wrap gap-2">
          <AppButton @click="exportProgress">Экспорт JSON</AppButton>
          <label
            class="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-[var(--color-border-strong)] bg-[var(--color-panel)] px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-panel-raised)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)]"
          >
            Импорт JSON
            <input type="file" accept="application/json" class="sr-only" @change="previewImport" />
          </label>
          <AppButton variant="secondary" @click="clearPersonalAnswers">Очистить ответы</AppButton>
          <AppButton variant="secondary" @click="resetProgress">Сбросить прогресс</AppButton>
          <AppButton variant="ghost" @click="fullReset">Полный сброс</AppButton>
        </div>
      </AppCard>
    </section>

    <AppAlert
      v-if="importPreview"
      :title="importPreview.valid ? 'Импорт готов' : 'Импорт отклонен'"
      :tone="importPreview.valid ? 'success' : 'error'"
    >
      {{ importPreview.summary }}
      <span v-if="importPreview.contentVersion">
        Версия контента: {{ importPreview.contentVersion }}.
      </span>
    </AppAlert>

    <AppAlert title="Локальная безопасность" tone="neutral">
      Поврежденное состояние переносится в backup и удаляется из активного хранилища. Частые записи
      debounce-ятся, а изменения из другой вкладки синхронизируются через storage events.
    </AppAlert>

    <p v-if="backupHint" class="text-sm text-[var(--color-text-muted)]">{{ backupHint }}</p>

    <AppDialog
      v-model:open="importDialogOpen"
      title="Перезаписать локальный прогресс?"
      description="Текущий прогресс и настройки будут заменены данными из файла."
    >
      <div class="space-y-4">
        <dl v-if="importPreview" class="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-[var(--color-text-muted)]">Схема</dt>
            <dd class="font-semibold text-[var(--color-text)]">
              v{{ importPreview.schemaVersion }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--color-text-muted)]">Контент</dt>
            <dd class="font-semibold text-[var(--color-text)]">
              {{ importPreview.contentVersion }}
            </dd>
          </div>
          <div>
            <dt class="text-[var(--color-text-muted)]">Checksum</dt>
            <dd class="font-semibold text-[var(--color-text)]">
              {{ importPreview.checksumValid ? 'совпадает' : 'ошибка' }}
            </dd>
          </div>
        </dl>
        <AppAlert title="Перед импортом" tone="warning">
          Приложение автоматически сохранит резервную копию текущего состояния, затем применит файл
          только после повторной Zod-валидации.
        </AppAlert>
        <div class="flex flex-wrap justify-end gap-2">
          <AppButton variant="secondary" @click="importDialogOpen = false">Отмена</AppButton>
          <AppButton @click="confirmImport">Перезаписать</AppButton>
        </div>
      </div>
    </AppDialog>
  </div>
</template>
