<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
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
  <DrawerRoot v-model:open="model">
    <DrawerTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="fixed inset-0 z-40 bg-black/45" />
      <DrawerContent
        class="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] rounded-t-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-2xl shadow-black/20 focus:outline-none"
      >
        <div
          class="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)]"
          aria-hidden="true"
        />
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <DrawerTitle class="text-lg font-semibold text-[var(--color-text)]">{{
              title
            }}</DrawerTitle>
            <DrawerDescription
              v-if="description"
              class="mt-1 text-sm text-[var(--color-text-muted)]"
            >
              {{ description }}
            </DrawerDescription>
          </div>
          <DrawerClose as-child>
            <AppIconButton label="Закрыть меню" size="sm">
              <X class="size-4" aria-hidden="true" />
            </AppIconButton>
          </DrawerClose>
        </div>
        <div class="mt-4 overflow-y-auto pb-4">
          <slot />
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
