<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import AppIconButton from './AppIconButton.vue'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
  }>(),
  {
    open: false,
    description: '',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const model = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
</script>

<template>
  <DialogRoot v-model:open="model">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/45" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl shadow-black/20 focus:outline-none"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <DialogTitle class="text-lg font-semibold text-[var(--color-text)]">{{
              title
            }}</DialogTitle>
            <DialogDescription
              v-if="description"
              class="mt-1 text-sm text-[var(--color-text-muted)]"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose as-child>
            <AppIconButton label="Закрыть диалог" size="sm">
              <X class="size-4" aria-hidden="true" />
            </AppIconButton>
          </DialogClose>
        </div>
        <div class="mt-5">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
