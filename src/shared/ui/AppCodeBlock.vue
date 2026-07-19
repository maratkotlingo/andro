<script setup lang="ts">
import { Clipboard } from '@lucide/vue'
import { useUiStore } from '../../stores/ui'
import AppIconButton from './AppIconButton.vue'

const props = withDefaults(
  defineProps<{
    code: string
    language?: string
    label?: string
  }>(),
  {
    language: 'kotlin',
    label: 'Kotlin',
  },
)

const ui = useUiStore()

async function copyCode(): Promise<void> {
  if (!navigator.clipboard) {
    ui.notify({
      tone: 'warning',
      title: 'Буфер обмена недоступен',
      description: 'Код можно выделить вручную.',
    })
    return
  }

  await navigator.clipboard.writeText(props.code)
  ui.notify({
    tone: 'success',
    title: 'Код скопирован',
    description: 'Фрагмент помещен в буфер обмена.',
  })
}
</script>

<template>
  <figure
    class="overflow-hidden rounded-lg border border-[var(--color-code-border)] bg-[var(--color-code-bg)]"
  >
    <figcaption
      class="flex items-center justify-between border-b border-[var(--color-code-border)] px-3 py-2 text-xs text-[var(--color-code-muted)]"
    >
      <span>{{ label }}</span>
      <AppIconButton label="Скопировать код" size="sm" variant="ghost" @click="copyCode">
        <Clipboard class="size-4" aria-hidden="true" />
      </AppIconButton>
    </figcaption>
    <pre
      class="overflow-x-auto p-4 text-sm leading-6 text-[var(--color-code-text)]"
      tabindex="0"
    ><code :class="`language-${language}`">{{ code }}</code></pre>
  </figure>
</template>
