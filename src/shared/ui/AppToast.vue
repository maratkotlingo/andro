<script setup lang="ts">
import { X } from '@lucide/vue'
import {
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'
import { useUiStore } from '../../stores/ui'
import AppIconButton from './AppIconButton.vue'
import { badgeTones } from './styles'

const ui = useUiStore()
</script>

<template>
  <ToastProvider swipe-direction="right">
    <ToastPortal>
      <ToastViewport
        class="fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      />
      <ToastRoot
        v-for="toast in ui.toasts"
        :key="toast.id"
        :duration="4200"
        :class="[
          'rounded-lg border bg-[var(--color-panel)] p-4 shadow-xl shadow-black/10',
          badgeTones[toast.tone],
        ]"
        @update:open="(open) => !open && ui.dismiss(toast.id)"
      >
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <ToastTitle class="text-sm font-semibold text-[var(--color-text)]">{{
              toast.title
            }}</ToastTitle>
            <ToastDescription class="mt-1 text-sm text-[var(--color-text-muted)]">
              {{ toast.description }}
            </ToastDescription>
          </div>
          <ToastClose as-child>
            <AppIconButton label="Закрыть уведомление" size="sm">
              <X class="size-4" aria-hidden="true" />
            </AppIconButton>
          </ToastClose>
        </div>
      </ToastRoot>
    </ToastPortal>
  </ToastProvider>
</template>
